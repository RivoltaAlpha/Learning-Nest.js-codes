# E2E Tests Documentation

## Overview
This directory contains end-to-end tests for the Profile module. The tests cover all CRUD operations, authentication, authorization, and role-based access control.

## Test Files

### 1. `profiles.e2e-spec.ts`
Complete e2e tests for the Profile module using the full application setup with PostgreSQL database.

**Features tested:**
- Profile creation (POST /profiles)
- Profile listing with filtering (GET /profiles)
- Single profile retrieval (GET /profiles/:id)
- Profile updates (PATCH /profiles/:id)
- Profile deletion (DELETE /profiles/:id)
- Role-based access control (Admin, Faculty, Student)
- Authentication and authorization
- Input validation
- Error handling
- Data integrity

### 2. `profiles-optimized.e2e-spec.ts`
Optimized version using in-memory SQLite database for faster test execution.

**Advantages:**
- Faster test execution
- No external database dependencies
- Isolated test environment
- Better for CI/CD pipelines

### 3. `test-utils.ts`
Utility functions and helpers for e2e testing.

**Includes:**
- Database configuration helpers
- Test data factories
- Database cleanup utilities
- Common test setup functions

## Running Tests

### Prerequisites
1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up test environment variables (create `.env.test`):
   ```env
   NODE_ENV=test
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=test_user
   DB_PASSWORD=test_password
   DB_NAME=nest_test_db
   JWT_SECRET=test-jwt-secret
   JWT_REFRESH_SECRET=test-refresh-secret
   ```

### Running E2E Tests

#### Run all e2e tests:
```bash
pnpm run test:e2e
```

#### Run specific test file:
```bash
# Full application tests
npx jest test/profiles.e2e-spec.ts --config ./test/jest-e2e.json

# Optimized tests (recommended)
npx jest test/profiles-optimized.e2e-spec.ts --config ./test/jest-e2e.json
```

#### Run tests with coverage:
```bash
npx jest test/profiles.e2e-spec.ts --config ./test/jest-e2e.json --coverage
```

#### Run tests in watch mode:
```bash
npx jest test/profiles.e2e-spec.ts --config ./test/jest-e2e.json --watch
```

## Test Structure

### Test Categories

1. **Profile Creation Tests**
   - Valid profile creation
   - Input validation
   - Required field validation
   - Email format validation
   - Role enum validation

2. **Profile Listing Tests**
   - Admin access
   - Faculty access
   - Student access denial
   - Email filtering
   - Authentication requirements

3. **Single Profile Retrieval Tests**
   - Authorized access
   - Profile not found handling
   - Parameter validation
   - Authentication requirements

4. **Profile Update Tests**
   - Successful updates
   - Input validation
   - Profile not found handling
   - Authentication requirements

5. **Profile Deletion Tests**
   - Admin-only access
   - Role-based restrictions
   - Profile not found handling
   - Authentication requirements

6. **Role-based Access Control Tests**
   - Admin privileges
   - Faculty privileges
   - Student privileges
   - Access restrictions

7. **Error Handling Tests**
   - Malformed JSON
   - Empty request body
   - Extra fields rejection
   - Invalid tokens
   - Missing authorization

8. **Data Integrity Tests**
   - Operation consistency
   - Timestamp handling
   - Password hashing
   - Data persistence

### Test Data

The tests use predefined test profiles:
- **Admin**: Full access to all operations
- **Faculty**: Limited access (no delete)
- **Student**: Minimal access (no list, no delete)

### Authentication Flow

1. Test profiles are created with hashed passwords
2. Authentication tokens are obtained via POST /auth/signin
3. Tokens are used in Authorization headers for protected endpoints

## Best Practices

1. **Test Isolation**: Each test has clean database state
2. **Realistic Data**: Uses faker.js for dynamic test data
3. **Error Coverage**: Tests both success and failure scenarios
4. **Security Testing**: Validates authentication and authorization
5. **Performance**: Optimized version for faster execution

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure test database is running
   - Check connection credentials in `.env.test`

2. **JWT Token Issues**
   - Verify JWT secrets in environment
   - Check token expiration settings

3. **Permission Denied**
   - Verify role-based access control implementation
   - Check guard configurations

4. **Test Timeout**
   - Use optimized test file for faster execution
   - Increase Jest timeout if needed

### Debug Mode

Run tests in debug mode:
```bash
npx jest test/profiles.e2e-spec.ts --config ./test/jest-e2e.json --detectOpenHandles --forceExit
```

## Coverage Goals

- **Statements**: > 95%
- **Branches**: > 90%
- **Functions**: > 95%
- **Lines**: > 95%

The tests are designed to achieve comprehensive coverage of the Profile module functionality while maintaining fast execution times and reliable results.
