import { TasksModule } from './tasks.module';

describe('TasksModule', () => {
  it('should be defined', () => {
    expect(TasksModule).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof TasksModule).toBe('function');
  });

  it('should be a valid NestJS module', () => {
    expect(TasksModule).toBeInstanceOf(Function);
  });
});
