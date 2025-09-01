import { AppModule } from './app.module';

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof AppModule).toBe('function');
  });

  it('should be a valid NestJS module', () => {
    expect(AppModule).toBeInstanceOf(Function);
  });
});
