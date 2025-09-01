import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { QueryTaskDto } from '../dto/query-task.dto';
import { TaskStatus } from '../schemas/task.schema';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: {
      _id: '507f1f77bcf86cd799439012',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Task Description',
        status: TaskStatus.TODO,
      };

      const expectedTask = {
        _id: '507f1f77bcf86cd799439011',
        ...createTaskDto,
        userId: mockRequest.user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTasksService.create.mockResolvedValue(expectedTask);

      const result = await controller.create(createTaskDto, mockRequest as any);

      expect(tasksService.create).toHaveBeenCalledWith(createTaskDto, mockRequest.user._id);
      expect(result).toEqual(expectedTask);
    });
  });

  describe('findAll', () => {
    it('should return all tasks with pagination', async () => {
      const queryDto: QueryTaskDto = {
        page: '1',
        page_size: '10',
      };

      const expectedResult = {
        tasks: [
          {
            _id: '507f1f77bcf86cd799439011',
            title: 'Task 1',
            description: 'Description 1',
            status: TaskStatus.TODO,
            userId: mockRequest.user._id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          page_size: 10,
          total: 1,
          total_pages: 1,
        },
      };

      mockTasksService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(queryDto, mockRequest as any);

      expect(tasksService.findAll).toHaveBeenCalledWith(queryDto, mockRequest.user._id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const taskId = '507f1f77bcf86cd799439011';
      const expectedTask = {
        _id: taskId,
        title: 'Task 1',
        description: 'Description 1',
        status: TaskStatus.TODO,
        userId: mockRequest.user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTasksService.findOne.mockResolvedValue(expectedTask);

      const result = await controller.findOne(taskId, mockRequest as any);

      expect(tasksService.findOne).toHaveBeenCalledWith(taskId, mockRequest.user._id);
      expect(result).toEqual(expectedTask);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const taskId = '507f1f77bcf86cd799439011';
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
      };

      const expectedTask = {
        _id: taskId,
        ...updateTaskDto,
        description: 'Original Description',
        userId: mockRequest.user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTasksService.update.mockResolvedValue(expectedTask);

      const result = await controller.update(taskId, updateTaskDto, mockRequest as any);

      expect(tasksService.update).toHaveBeenCalledWith(taskId, updateTaskDto, mockRequest.user._id);
      expect(result).toEqual(expectedTask);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const taskId = '507f1f77bcf86cd799439011';

      mockTasksService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(taskId, mockRequest as any);

      expect(tasksService.remove).toHaveBeenCalledWith(taskId, mockRequest.user._id);
      expect(result).toBeUndefined();
    });
  });
});
