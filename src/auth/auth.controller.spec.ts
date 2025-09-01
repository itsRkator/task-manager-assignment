import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto } from '../dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should call authService.signUp with correct data', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const expectedResult = {
        access_token: 'jwt-token',
        user: {
          id: 'user-id',
          email: signUpDto.email,
          name: signUpDto.name,
        },
      };

      mockAuthService.signUp.mockResolvedValue(expectedResult);

      const result = await controller.signUp(signUpDto);

      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with correct data', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'jwt-token',
        user: {
          id: 'user-id',
          email: signInDto.email,
          name: 'Test User',
        },
      };

      mockAuthService.signIn.mockResolvedValue(expectedResult);

      const result = await controller.signIn(signInDto);

      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
