import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { TaskStatus } from '../src/schemas/task.schema';

describe('Task Manager API Integration Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('Authentication', () => {
    it('should sign up a new user', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toMatchObject({
        email: signUpData.email,
        name: signUpData.name,
      });

      authToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('should sign in with valid credentials', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response =       await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signInData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe(signInData.email);
    });

    it('should reject sign in with invalid credentials', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signInData)
        .expect(401);
    });

    it('should reject duplicate email signup', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Another User',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpData)
        .expect(409);
    });
  });

  describe('Tasks CRUD', () => {
    let taskId: string;

    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.TODO,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        userId,
      });

      taskId = response.body._id;
    });

    it('should get all tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks.length).toBeGreaterThan(0);
    });

    it('should get tasks with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?page=1&page_size=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        page_size: 5,
      });
    });

    it('should filter tasks by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks?status=${TaskStatus.TODO}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks.every((task: any) => task.status === TaskStatus.TODO)).toBe(true);
    });

    it('should get a single task', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(taskId);
    });

    it('should update a task', async () => {
      const updateData = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
      };

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.status).toBe(updateData.status);
    });

    it('should delete a task', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify task is deleted
      await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/tasks')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Validation', () => {
    it('should reject task creation without title', async () => {
      const taskData = {
        description: 'Test Description',
        status: TaskStatus.TODO,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);
    });

    it('should reject task creation with invalid status', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'invalid-status',
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);
    });

    it('should reject signup with invalid email', async () => {
      const signUpData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpData)
        .expect(400);
    });

    it('should reject signup with short password', async () => {
      const signUpData = {
        email: 'test2@example.com',
        password: '123',
        name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpData)
        .expect(400);
    });

    it('should reject signup with empty name', async () => {
      const signUpData = {
        email: 'test3@example.com',
        password: 'password123',
        name: '',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpData)
        .expect(400);
    });

    it('should reject signin with invalid email', async () => {
      const signInData = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signInData)
        .expect(400);
    });

    it('should reject signin with empty password', async () => {
      const signInData = {
        email: 'test@example.com',
        password: '',
      };

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signInData)
        .expect(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long task titles', async () => {
      const longTitle = 'A'.repeat(1000);
      const taskData = {
        title: longTitle,
        description: 'Test Description',
        status: TaskStatus.TODO,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe(longTitle);
    });

    it('should handle empty task descriptions', async () => {
      const taskData = {
        title: 'Test Task',
        description: '',
        status: TaskStatus.TODO,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.description).toBe('');
    });

    it('should handle pagination with large page numbers', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?page=999&page_size=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(999);
      expect(response.body.tasks).toHaveLength(0);
    });

    it('should handle pagination with large page sizes', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?page=1&page_size=1000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.page_size).toBe(1000);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain user isolation between different users', async () => {
      // Create second user
      const secondUserData = {
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2',
      };

      const secondUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(secondUserData)
        .expect(201);

      const secondUserToken = secondUserResponse.body.access_token;

      // Create task for second user
      const taskData = {
        title: 'User 2 Task',
        description: 'This task belongs to user 2',
        status: TaskStatus.TODO,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send(taskData)
        .expect(201);

      // Verify first user cannot see second user's task
      const firstUserTasks = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const user2Tasks = firstUserTasks.body.tasks.filter(
        (task: any) => task.title === 'User 2 Task'
      );
      expect(user2Tasks).toHaveLength(0);
    });

    it('should handle task updates with partial data', async () => {
      const taskData = {
        title: 'Original Task',
        description: 'Original Description',
        status: TaskStatus.TODO,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      const taskId = createResponse.body._id;

      // Update only title
      const updateData = {
        title: 'Updated Task Title',
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.title).toBe('Updated Task Title');
      expect(updateResponse.body.description).toBe('Original Description');
      expect(updateResponse.body.status).toBe(TaskStatus.TODO);
    });
  });
});
