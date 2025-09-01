# Testing Documentation

## Overview

This Task Manager API includes comprehensive test coverage with unit tests, integration tests, and end-to-end tests.

## Test Structure

### Unit Tests
- **Location**: `src/**/*.spec.ts`
- **Coverage**: Individual service and controller methods
- **Framework**: Jest with NestJS testing utilities

### Integration Tests
- **Location**: `test/app.integration.spec.ts`
- **Coverage**: API endpoints with in-memory MongoDB
- **Framework**: Jest with Supertest

### End-to-End Tests
- **Location**: `test/app.e2e-spec.ts`
- **Coverage**: Complete user workflows
- **Framework**: Jest with Supertest and MongoDB Memory Server

## Test Coverage

Current test coverage:
- **Statements**: 41.36%
- **Branches**: 30.3%
- **Functions**: 51.85%
- **Lines**: 41.17%

### Key Areas Covered

#### Authentication Service (83.33% coverage)
- ✅ User signup with validation
- ✅ User signin with credential verification
- ✅ Password hashing and comparison
- ✅ JWT token generation
- ✅ User validation

#### Tasks Service (92.85% coverage)
- ✅ Task creation
- ✅ Task retrieval with pagination
- ✅ Task filtering by status
- ✅ Task updates
- ✅ Task deletion
- ✅ Error handling for invalid IDs

#### API Endpoints
- ✅ Authentication endpoints (`/auth/signup`, `/auth/signin`)
- ✅ Task CRUD endpoints (`/tasks`)
- ✅ Authorization middleware
- ✅ Input validation
- ✅ Error handling

## Running Tests

### Unit Tests
```bash
npm test
```

### Unit Tests with Coverage
```bash
npm run test:cov
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:watch
```

### Debug Mode
```bash
npm run test:debug
```

## Test Categories

### 1. Authentication Tests
- **Signup**: Valid user creation, duplicate email handling
- **Signin**: Valid credentials, invalid credentials
- **JWT**: Token generation, validation, expiration

### 2. Task Management Tests
- **CRUD Operations**: Create, read, update, delete tasks
- **Pagination**: Page-based navigation with configurable page sizes
- **Filtering**: Filter tasks by status (todo, in_progress, done)
- **Authorization**: User-specific task access

### 3. Validation Tests
- **Input Validation**: Required fields, data types, enum values
- **Error Handling**: Invalid IDs, missing data, malformed requests
- **Security**: Unauthorized access, rate limiting

### 4. Integration Tests
- **Database Operations**: MongoDB integration with in-memory database
- **API Workflows**: Complete user journeys from signup to task management
- **Error Scenarios**: Network errors, database failures, validation errors

## Test Data

### Mock Data
- **Users**: Test users with valid email/password combinations
- **Tasks**: Sample tasks with different statuses and descriptions
- **JWT Tokens**: Valid and invalid tokens for authorization testing

### Test Database
- **In-Memory MongoDB**: Isolated test environment
- **Automatic Cleanup**: Fresh database for each test suite
- **Realistic Data**: Production-like data structures

## Test Utilities

### Setup Functions
- **Database Setup**: MongoDB Memory Server configuration
- **Authentication Setup**: JWT token generation for tests
- **Mock Data**: Reusable test data factories

### Assertions
- **HTTP Status Codes**: Proper response codes for all scenarios
- **Response Structure**: Valid JSON structure and data types
- **Error Messages**: Consistent error handling and messaging

## Best Practices

### Test Organization
- **Descriptive Names**: Clear test descriptions
- **Single Responsibility**: One assertion per test
- **Setup/Teardown**: Proper test isolation

### Mocking Strategy
- **External Dependencies**: Database, external APIs
- **Service Dependencies**: Cross-service interactions
- **Time-dependent Code**: Date/time mocking

### Error Testing
- **Happy Path**: Successful operations
- **Error Paths**: Failure scenarios and edge cases
- **Boundary Conditions**: Limits and constraints

## Continuous Integration

### Pre-commit Hooks
- **Linting**: ESLint and Prettier checks
- **Type Checking**: TypeScript compilation
- **Test Execution**: Unit test validation

### CI Pipeline
- **Test Execution**: All test suites
- **Coverage Reporting**: Coverage threshold enforcement
- **Build Validation**: Production build verification

## Performance Testing

### Load Testing
- **Rate Limiting**: Request throttling validation
- **Concurrent Users**: Multiple simultaneous requests
- **Database Performance**: Query optimization testing

### Memory Testing
- **Memory Leaks**: Long-running test scenarios
- **Resource Cleanup**: Proper resource disposal

## Future Improvements

### Additional Test Coverage
- [ ] Controller unit tests
- [ ] Middleware testing
- [ ] Database migration tests
- [ ] Performance benchmarks

### Test Automation
- [ ] Automated test data generation
- [ ] Visual regression testing
- [ ] API contract testing
- [ ] Load testing automation

## Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB Memory Server is properly configured
2. **JWT Tokens**: Verify token expiration and secret configuration
3. **Test Isolation**: Check for shared state between tests
4. **Async Operations**: Proper async/await usage in tests

### Debug Tips
- Use `console.log` for debugging test data
- Check test database state between operations
- Verify mock function calls and parameters
- Review error stack traces for detailed failure information
