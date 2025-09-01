# Task Manager API

A robust NestJS backend service for managing tasks with JWT authentication, built with MongoDB and comprehensive validation.

## Features

- 🔐 JWT Authentication (Signup/Login)
- 📝 CRUD Operations for Tasks
- 🔍 Pagination and Filtering
- ✅ Input Validation
- 🛡️ Rate Limiting
- 📊 Request Logging
- 🚨 Consistent Error Handling
- 🔒 Security Middleware

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **Security**: Helmet, Rate Limiting
- **Logging**: Morgan

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd task-manager-assignment
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   MONGODB_URI=mongodb://localhost:27017/task-manager
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=3000
   ```

4. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod

   # Or use MongoDB Atlas cloud instance
   ```

5. **Run the application**

   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run start:prod
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

#### Sign Up

```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Sign In

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Tasks (Protected Routes - Requires JWT Token)

#### Create Task

```http
POST /tasks
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "status": "todo"
}
```

#### Get All Tasks (with pagination and filtering)

```http
GET /tasks?status=todo&page=1&page_size=10
Authorization: Bearer <your-jwt-token>
```

#### Get Single Task

```http
GET /tasks/<task-id>
Authorization: Bearer <your-jwt-token>
```

#### Update Task

```http
PATCH /tasks/<task-id>
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "title": "Updated task title",
  "status": "in_progress"
}
```

#### Delete Task

```http
DELETE /tasks/<task-id>
Authorization: Bearer <your-jwt-token>
```

## Task Status Values

- `todo` - Task is pending
- `in_progress` - Task is being worked on
- `done` - Task is completed

## Query Parameters

### GET /tasks

- `status` (optional): Filter by task status (`todo`, `in_progress`, `done`)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Number of items per page (default: 10)

## Response Examples

### Successful Authentication Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a1b2c3d4e5f6789abcdef0",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Task Response

```json
{
  "_id": "64a1b2c3d4e5f6789abcdef1",
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "status": "todo",
  "userId": "64a1b2c3d4e5f6789abcdef0",
  "createdAt": "2023-07-01T10:00:00.000Z",
  "updatedAt": "2023-07-01T10:00:00.000Z"
}
```

### Paginated Tasks Response

```json
{
  "tasks": [
    {
      "_id": "64a1b2c3d4e5f6789abcdef1",
      "title": "Task 1",
      "description": "Description 1",
      "status": "todo",
      "userId": "64a1b2c3d4e5f6789abcdef0",
      "createdAt": "2023-07-01T10:00:00.000Z",
      "updatedAt": "2023-07-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "timestamp": "2023-07-01T10:00:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": ["title should not be empty"]
}
```

## Security Features

- **JWT Authentication**: All task endpoints require valid JWT tokens
- **Rate Limiting**: 100 requests per minute per IP
- **Input Validation**: All inputs are validated using class-validator
- **Security Headers**: Helmet middleware for security headers
- **Password Hashing**: bcryptjs for secure password storage
- **CORS**: Cross-origin resource sharing enabled

## Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Formatting

```bash
npm run format
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── tasks/                # Tasks module
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── tasks.module.ts
├── schemas/              # MongoDB schemas
│   ├── task.schema.ts
│   └── user.schema.ts
├── dto/                  # Data Transfer Objects
│   ├── auth.dto.ts
│   ├── create-task.dto.ts
│   ├── update-task.dto.ts
│   └── query-task.dto.ts
├── filters/              # Exception filters
│   └── http-exception.filter.ts
├── app.module.ts         # Root module
└── main.ts              # Application entry point
```

## License

This project is licensed under the MIT License.
