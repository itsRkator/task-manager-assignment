import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TaskStatus } from '../src/schemas/task.schema';

describe('Task Manager API (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('MONGODB_URI')
      .useValue(mongoUri)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    // Reset auth token for each test
    authToken = '';
    userId = '';
  });

  const setupAuth = async () => {
    if (!authToken) {
      const signUpData = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpData)
        .expect(201);

      authToken = response.body.access_token;
      userId = response.body.user.id;
    }
  };

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('Complete User Workflow', () => {
    it('should complete full user workflow: signup -> create tasks -> manage tasks', async () => {
      // 1. Sign up a new user
      const signUpData = {
        email: `e2e-${Date.now()}@example.com`,
        password: 'password123',
        name: 'E2E Test User',
      };

      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpData)
        .expect(201);

      authToken = signUpResponse.body.access_token;
      userId = signUpResponse.body.user.id;

      // 2. Create multiple tasks
      const tasks = [
        {
          title: 'Complete project documentation',
          description: 'Write comprehensive API documentation',
          status: TaskStatus.TODO,
        },
        {
          title: 'Review code changes',
          description: 'Review pull requests and provide feedback',
          status: TaskStatus.IN_PROGRESS,
        },
        {
          title: 'Deploy to production',
          description: 'Deploy the application to production environment',
          status: TaskStatus.DONE,
        },
      ];

      const createdTasks: any[] = [];
      for (const taskData of tasks) {
        const response = await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(201);
        
        createdTasks.push(response.body);
      }

      // 3. Get all tasks and verify
      const allTasksResponse = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(allTasksResponse.body.tasks).toHaveLength(3);
      expect(allTasksResponse.body.pagination.total).toBe(3);

      // 4. Filter tasks by status
      const todoTasksResponse = await request(app.getHttpServer())
        .get('/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(todoTasksResponse.body.tasks).toHaveLength(1);
      expect(todoTasksResponse.body.tasks[0].status).toBe(TaskStatus.TODO);

      // 5. Update a task
      const taskToUpdate = createdTasks[0];
      const updateData = {
        title: 'Updated: Complete project documentation',
        status: TaskStatus.IN_PROGRESS,
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/tasks/${taskToUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.title).toBe(updateData.title);
      expect(updateResponse.body.status).toBe(updateData.status);

      // 6. Get single task
      const singleTaskResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskToUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(singleTaskResponse.body._id).toBe(taskToUpdate._id);

      // 7. Delete a task
      await request(app.getHttpServer())
        .delete(`/tasks/${createdTasks[2]._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 8. Verify task is deleted
      const finalTasksResponse = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalTasksResponse.body.tasks).toHaveLength(2);
      expect(finalTasksResponse.body.pagination.total).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid task ID gracefully', async () => {
      await setupAuth();
      await request(app.getHttpServer())
        .get('/tasks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle unauthorized access', async () => {
      await request(app.getHttpServer())
        .get('/tasks')
        .expect(401);
    });

    it('should handle rate limiting', async () => {
      await setupAuth();
      // Make multiple requests to test rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed (rate limit is 100/minute)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate task creation data', async () => {
      await setupAuth();
      const invalidTaskData = {
        // Missing required title
        description: 'Test Description',
        status: 'invalid-status',
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTaskData)
        .expect(400);
    });

    it('should validate pagination parameters', async () => {
      await setupAuth();
      await request(app.getHttpServer())
        .get('/tasks?page=invalid&page_size=abc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should validate signup data', async () => {
      const invalidSignupData = {
        email: 'invalid-email',
        password: '123',
        name: '',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidSignupData)
        .expect(400);
    });

    it('should validate signin data', async () => {
      const invalidSigninData = {
        email: 'invalid-email',
        password: '',
      };

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(invalidSigninData)
        .expect(400);
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple concurrent requests', async () => {
      await setupAuth();
      
      const concurrentRequests = Array(20).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });

    it('should handle bulk task creation', async () => {
      await setupAuth();
      
      const tasks = Array(10).fill(null).map((_, index) => ({
        title: `Bulk Task ${index + 1}`,
        description: `Description for task ${index + 1}`,
        status: TaskStatus.TODO,
      }));

      const createPromises = tasks.map(taskData =>
        request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
      );

      const responses = await Promise.all(createPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('title');
      });
    });
  });

  describe('Security', () => {
    it('should prevent SQL injection attempts', async () => {
      await setupAuth();
      
      const maliciousData = {
        title: "'; DROP TABLE tasks; --",
        description: 'Malicious description',
        status: TaskStatus.TODO,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201);

      // Should create the task with the literal string, not execute SQL
      expect(response.body.title).toBe("'; DROP TABLE tasks; --");
    });

    it('should prevent XSS attempts', async () => {
      await setupAuth();
      
      const xssData = {
        title: '<script>alert("XSS")</script>',
        description: '<img src="x" onerror="alert(\'XSS\')">',
        status: TaskStatus.TODO,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssData)
        .expect(201);

      // Should store the literal strings, not execute scripts
      expect(response.body.title).toBe('<script>alert("XSS")</script>');
      expect(response.body.description).toBe('<img src="x" onerror="alert(\'XSS\')">');
    });

    it('should handle malformed JWT tokens', async () => {
      const malformedTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        '',
        null,
      ];

      for (const token of malformedTokens) {
        if (token !== null) {
          await request(app.getHttpServer())
            .get('/tasks')
            .set('Authorization', token)
            .expect(401);
        } else {
          await request(app.getHttpServer())
            .get('/tasks')
            .expect(401);
        }
      }
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      await setupAuth();
      
      // Create a task
      const taskData = {
        title: 'Consistency Test Task',
        description: 'Testing data consistency',
        status: TaskStatus.TODO,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      const taskId = createResponse.body._id;

      // Verify task exists
      const getResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body._id).toBe(taskId);
      expect(getResponse.body.title).toBe(taskData.title);

      // Update task
      const updateData = {
        status: TaskStatus.IN_PROGRESS,
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updateResponse.body.title).toBe(taskData.title); // Should remain unchanged

      // Verify update persisted
      const verifyResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should handle task deletion and verify removal', async () => {
      await setupAuth();
      
      // Create a task
      const taskData = {
        title: 'Task to be deleted',
        description: 'This task will be deleted',
        status: TaskStatus.TODO,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      const taskId = createResponse.body._id;

      // Delete the task
      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify task is deleted
      await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Verify task doesn't appear in list
      const listResponse = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedTask = listResponse.body.tasks.find(
        (task: any) => task._id === taskId
      );
      expect(deletedTask).toBeUndefined();
    });
  });
});