import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from '../schemas/task.schema';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { QueryTaskDto } from '../dto/query-task.dto';

describe('TasksService', () => {
  let service: TasksService;
  let taskModel: any;

  const mockTask = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    userId: '507f1f77bcf86cd799439012',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  const mockTaskModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskModel = module.get(getModelToken(Task.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.TODO,
    };
    const userId = '507f1f77bcf86cd799439012';

    it('should create a new task', async () => {
      const newTask = { ...mockTask, ...createTaskDto };
      
      // Mock the constructor and save method
      const mockInstance = { save: jest.fn().mockResolvedValue(newTask) };
      const mockConstructor = jest.fn().mockImplementation(() => mockInstance);
      
      // Replace the service's taskModel with our mock
      (service as any).taskModel = mockConstructor;

      const result = await service.create(createTaskDto, userId);

      expect(result).toEqual(newTask);
      expect(mockConstructor).toHaveBeenCalledWith({
        ...createTaskDto,
        userId,
      });
      expect(mockInstance.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const userId = '507f1f77bcf86cd799439012';
    const mockTasks = [mockTask];

    it('should return tasks with pagination', async () => {
      const queryDto: QueryTaskDto = {
        page: '1',
        page_size: '10',
      };

      taskModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockTasks),
          }),
        }),
      });
      taskModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(queryDto, userId);

      expect(result).toEqual({
        tasks: mockTasks,
        pagination: {
          page: 1,
          page_size: 10,
          total: 1,
          total_pages: 1,
        },
      });
    });

    it('should filter tasks by status', async () => {
      const queryDto: QueryTaskDto = {
        status: TaskStatus.IN_PROGRESS,
        page: '1',
        page_size: '10',
      };

      taskModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      taskModel.countDocuments.mockResolvedValue(0);

      await service.findAll(queryDto, userId);

      expect(taskModel.find).toHaveBeenCalledWith({
        userId,
        status: TaskStatus.IN_PROGRESS,
      });
    });
  });

  describe('findOne', () => {
    const taskId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439012';

    it('should return a task if found', async () => {
      taskModel.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(taskId, userId);

      expect(result).toEqual(mockTask);
      expect(taskModel.findOne).toHaveBeenCalledWith({
        _id: taskId,
        userId,
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      taskModel.findOne.mockResolvedValue(null);

      await expect(service.findOne(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle CastError and throw NotFoundException', async () => {
      const invalidTaskId = 'invalid-id';
      const castError = new Error('CastError');
      castError.name = 'CastError';
      taskModel.findOne.mockRejectedValue(castError);

      await expect(service.findOne(invalidTaskId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const taskId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439012';
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task',
      status: TaskStatus.IN_PROGRESS,
    };

    it('should update and return the task', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      taskModel.findOneAndUpdate.mockResolvedValue(updatedTask);

      const result = await service.update(taskId, updateTaskDto, userId);

      expect(result).toEqual(updatedTask);
      expect(taskModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: taskId, userId },
        updateTaskDto,
        { new: true },
      );
    });

    it('should throw NotFoundException if task not found', async () => {
      taskModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.update(taskId, updateTaskDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle CastError and throw NotFoundException', async () => {
      const invalidTaskId = 'invalid-id';
      const castError = new Error('CastError');
      castError.name = 'CastError';
      taskModel.findOneAndUpdate.mockRejectedValue(castError);

      await expect(service.update(invalidTaskId, updateTaskDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const taskId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439012';

    it('should delete the task', async () => {
      taskModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.remove(taskId, userId);

      expect(taskModel.deleteOne).toHaveBeenCalledWith({
        _id: taskId,
        userId,
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      taskModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(service.remove(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle CastError and throw NotFoundException', async () => {
      const invalidTaskId = 'invalid-id';
      const castError = new Error('CastError');
      castError.name = 'CastError';
      taskModel.deleteOne.mockRejectedValue(castError);

      await expect(service.remove(invalidTaskId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});