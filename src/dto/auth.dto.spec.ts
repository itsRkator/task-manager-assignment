import { validate } from 'class-validator';
import { SignUpDto, SignInDto } from './auth.dto';

describe('Auth DTOs', () => {
  describe('SignUpDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new SignUpDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.name = 'Test User';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new SignUpDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';
      dto.name = 'Test User';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });

    it('should fail validation with short password', async () => {
      const dto = new SignUpDto();
      dto.email = 'test@example.com';
      dto.password = '123';
      dto.name = 'Test User';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });

    it('should fail validation with empty name', async () => {
      const dto = new SignUpDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.name = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });
  });

  describe('SignInDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new SignInDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new SignInDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });

    it('should fail validation with empty password', async () => {
      const dto = new SignInDto();
      dto.email = 'test@example.com';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });
  });
});
