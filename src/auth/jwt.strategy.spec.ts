import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user if validation succeeds', async () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };

      const mockUser = {
        _id: payload.sub,
        email: payload.email,
        name: 'Test User',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(authService.validateUser).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user validation fails', async () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).toHaveBeenCalledWith(payload.sub);
    });
  });
});
