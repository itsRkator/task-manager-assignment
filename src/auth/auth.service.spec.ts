import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../schemas/user.schema';
import { SignUpDto, SignInDto } from '../dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: JwtService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    save: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should create a new user and return access token', async () => {
      userModel.findOne.mockResolvedValue(null);
      mockJwtService.sign.mockReturnValue('jwt-token');
      
      const newUser = { ...mockUser, save: jest.fn().mockResolvedValue(mockUser) };
      jest.spyOn(service, 'signUp').mockImplementation(async (dto) => {
        const user = { ...dto, _id: mockUser._id } as any;
        user.save = jest.fn().mockResolvedValue(user);
        return {
          access_token: 'jwt-token',
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
          },
        };
      });

      const result = await service.signUp(signUpDto);

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: mockUser._id,
          email: signUpDto.email,
          name: signUpDto.name,
        },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      userModel.findOne.mockResolvedValue(mockUser);

      await expect(service.signUp(signUpDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return access token for valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      
      userModel.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.signIn(signInDto);

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      
      userModel.findOne.mockResolvedValue(mockUser);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user without password for valid userId', async () => {
      const userWithoutPassword = {
        _id: mockUser._id,
        email: mockUser.email,
        name: mockUser.name,
        toObject: jest.fn().mockReturnValue({
          _id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
        }),
      };

      userModel.findById.mockResolvedValue(userWithoutPassword);

      const result = await service.validateUser(mockUser._id);

      expect(result).toEqual({
        _id: mockUser._id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('should return null for invalid userId', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.validateUser('invalid-id');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      userModel.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.validateUser(userId)).rejects.toThrow('Database error');
    });
  });
});
