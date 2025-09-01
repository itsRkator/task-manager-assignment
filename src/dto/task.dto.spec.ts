import { validate } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import { QueryTaskDto } from './query-task.dto';
import { TaskStatus } from '../schemas/task.schema';

describe('Task DTOs', () => {
  describe('CreateTaskDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreateTaskDto();
      dto.title = 'Test Task';
      dto.description = 'Test Description';
      dto.status = TaskStatus.TODO;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal data', async () => {
      const dto = new CreateTaskDto();
      dto.title = 'Test Task';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty title', async () => {
      const dto = new CreateTaskDto();
      dto.title = '';
      dto.description = 'Test Description';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
    });

    it('should fail validation with invalid status', async () => {
      const dto = new CreateTaskDto();
      dto.title = 'Test Task';
      dto.status = 'invalid-status' as TaskStatus;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('UpdateTaskDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new UpdateTaskDto();
      dto.title = 'Updated Task';
      dto.description = 'Updated Description';
      dto.status = TaskStatus.IN_PROGRESS;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty data', async () => {
      const dto = new UpdateTaskDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = new UpdateTaskDto();
      dto.status = 'invalid-status' as TaskStatus;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('QueryTaskDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new QueryTaskDto();
      dto.status = TaskStatus.TODO;
      dto.page = '1';
      dto.page_size = '10';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty data', async () => {
      const dto = new QueryTaskDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = new QueryTaskDto();
      dto.status = 'invalid-status' as TaskStatus;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation with non-numeric page', async () => {
      const dto = new QueryTaskDto();
      dto.page = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });

    it('should fail validation with non-numeric page_size', async () => {
      const dto = new QueryTaskDto();
      dto.page_size = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page_size');
    });
  });
});
