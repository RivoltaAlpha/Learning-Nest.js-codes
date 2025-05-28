# School Management

please check the [api design](./API Design.md)

## Fakerjs Setup

Faker is a popular library that generates fake (but reasonable) data that can be used for things such as:

* Unit Testing
* Performance Testing
* Building Demos
* Working without a completed backend

```bash
pnpm add @faker-js/faker --save-dev
```

## Database Seeding Implementation

Seeding is a critical part of application development that allows you to populate your database with sample data for development and testing purposes. In this section, we'll implement a comprehensive seeding mechanism for our School Management API.

### Why Seeding Matters

- **Development**: Provides realistic data to work with during development
- **Testing**: Enables consistent testing scenarios
- **Demo**: Creates data for application demonstrations
- **Performance Testing**: Allows you to test with realistic data volumes

### Setting Up the Seeding Module

First, we create a dedicated module for seeding:

```bash
nest g mo seed
nest g s seed
nest g co seed
```

### Seed Module Structure

The seed module should import all entity repositories that we want to seed:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { Student } from '../students/entities/student.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Department } from '../departments/entities/department.entity';
import { Course } from '../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Profile, Department, Course])],
  providers: [SeedService],
  controllers: [SeedController],
})
export class SeedModule {}
```

### Creating the Seed Controller

The seed controller provides an endpoint to trigger the seeding process:

```typescript
import { Controller, Post, HttpStatus, HttpCode, Logger } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  private readonly logger = new Logger(SeedController.name);

  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async seed() {
    this.logger.log('Seed endpoint called');
    return this.seedService.seed();
  }
}
```

This controller exposes a POST endpoint at `/seed` that will trigger the data seeding process.

### Implementing the Seed Service

The seed service is where the main seeding logic lives. It performs the following tasks:

1. Clears existing data from the database in the correct order to respect foreign key constraints
2. Seeds departments
3. Seeds courses with random department assignments
4. Seeds profiles and students with random course enrollments

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Student } from '../students/entities/student.entity';
import { Profile, Role } from '../profiles/entities/profile.entity';
import { Department } from '../departments/entities/department.entity';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly dataSource: DataSource,
  ) {}

  async seed() {
    this.logger.log('Starting the seeding process...');

    try {
      // Clear all tables using a transaction
      await this.clearTables();
  
      // Seed departments
      const departments = await this.seedDepartments();
  
      // Seed courses
      const courses = await this.seedCourses(departments);
  
      // Seed profiles and students
      const students = await this.seedStudentsAndProfiles(courses);
  
      this.logger.log('Seeding completed successfully');
      return { message: 'Database seeded successfully' };
    } catch (error) {
      this.logger.error('Error during seeding:', error);
      throw error;
    }
  }

  private async clearTables() {
    this.logger.log('Clearing existing data...');

    // Using QueryRunner for transaction support
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Order matters due to foreign key relationships
      await queryRunner.query('DELETE FROM student_courses_course'); // Delete from junction table first
      await queryRunner.query('DELETE FROM student'); // Student has FK to Profile
      await queryRunner.query('DELETE FROM profile');
      await queryRunner.query('DELETE FROM course'); // Course has FK to Department
      await queryRunner.query('DELETE FROM department');

      await queryRunner.commitTransaction();
      this.logger.log('All tables cleared successfully');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to clear tables', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async seedDepartments() {
    this.logger.log('Seeding departments...');
    const departments: Department[] = [];
    const departmentNames = [
      'Computer Science',
      'Mathematics',
      'Physics',
      'Biology',
      'Chemistry',
      'Psychology',
      'Business Administration',
      'Engineering',
    ];

    for (const name of departmentNames) {
      const department = new Department();
      department.name = name;
      department.description = faker.lorem.paragraph();
      department.headOfDepartment = `Dr. ${faker.person.fullName()}`;
      departments.push(await this.departmentRepository.save(department));
    }
    this.logger.log(`Created ${departments.length} departments`);
    return departments;
  }

  private async seedCourses(departments: Department[]) {
    this.logger.log('Seeding courses...');
    const courses: Course[] = [];
    const courseTitles = [
      'Introduction to Programming',
      'Data Structures and Algorithms',
      'Database Systems',
      'Machine Learning',
      'Web Development',
      'Linear Algebra',
      'Calculus I',
      'Quantum Physics',
      'Organic Chemistry',
      'Human Physiology',
      'Cognitive Psychology',
      'Financial Accounting',
      'Marketing Management',
      'Electrical Engineering Fundamentals',
      'Mechanical Engineering Principles',
    ];

    for (const title of courseTitles) {
      const course = new Course();
      course.title = title;
      course.description = faker.lorem.paragraph();
      course.credits = faker.number.int({ min: 1, max: 5 });
      course.duration = `${faker.number.int({ min: 8, max: 16 })} weeks`;

      // Random dates for start and end
      const startDate = faker.date.past({ years: 1 });
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + faker.number.int({ min: 3, max: 6 }));
  
      course.startDate = startDate.toISOString().split('T')[0];
      course.endDate = endDate.toISOString().split('T')[0];

      // Assign a random department to this course
      course.department = departments[faker.number.int({ min: 0, max: departments.length - 1 })];

      courses.push(await this.courseRepository.save(course));
    }
    this.logger.log(`Created ${courses.length} courses`);
    return courses;
  }

  private async seedStudentsAndProfiles(courses: Course[]) {
    this.logger.log('Seeding profiles and students...');
    const students: Student[] = [];

    for (let i = 0; i < 50; i++) {
      // Create profile
      const profile = new Profile();
      profile.firstName = faker.person.firstName();
      profile.lastName = faker.person.lastName();
      profile.email = faker.internet.email({
        firstName: profile.firstName,
        lastName: profile.lastName,
        provider: 'university.edu',
      });
      profile.role = Role.STUDENT;

      // Save the profile
      const savedProfile = await this.profileRepository.save(profile);

      // Create student linked to the profile
      const student = new Student();
      student.enrollmentDate = faker.date.past({ years: 4 }).toISOString().split('T')[0];
  
      const degreePrograms = ['Bachelor of Science', 'Bachelor of Arts', 'Master of Science', 'PhD'];
      student.degreeProgram = degreePrograms[faker.number.int({ min: 0, max: degreePrograms.length - 1 })];
  
      student.gpa = parseFloat(faker.number.float({ min: 2.0, max: 4.0, fractionDigits: 2 }).toFixed(2));
      student.profile = savedProfile;

      // Save the student
      const savedStudent = await this.studentRepository.save(student);

      // Assign random courses to the student (between 3 and 6 courses)
      const numberOfCourses = faker.number.int({ min: 3, max: 6 });
      const studentCourses: Course[] = [];
      const availableCourses = [...courses]; // Copy courses to avoid modifying the original array

      for (let j = 0; j < numberOfCourses; j++) {
        if (availableCourses.length === 0) break;

        const randomIndex = faker.number.int({
          min: 0,
          max: availableCourses.length - 1,
        });
        const selectedCourse = availableCourses.splice(randomIndex, 1)[0]; // Remove the selected course
        studentCourses.push(selectedCourse);
      }

      // Update the student's courses
      savedStudent.courses = studentCourses;
      await this.studentRepository.save(savedStudent);

      students.push(savedStudent);
    }
    this.logger.log(`Created ${students.length} students with profiles`);
    return students;
  }
}
```

### Key Aspects of the Seeding Implementation

1. **Dependency Injection**: The service injects repositories for all entities we want to seed and the TypeORM DataSource for transaction support.
2. **Transaction Support**: Uses a query runner with transactions to ensure data consistency when clearing tables. If any query fails, all changes are rolled back.
3. **Entity Relationships**: The seeding process respects entity relationships:

   - Creates departments first
   - Creates courses with references to departments
   - Creates profiles and students with enrollments in courses
4. **Faker.js Integration**: Uses Faker.js to generate realistic data such as names, email addresses, paragraphs, dates, and numerical values.
5. **Many-to-Many Relationships**: Demonstrates how to seed many-to-many relationships by assigning random courses to each student.

### Using the Seed Endpoint

Once your application is running, you can trigger the seeding process with an HTTP request:

```bash
curl -X POST http://localhost:8000/seed
```

Or using tools like Postman or Insomnia to make a POST request to `/seed`.

This seeding implementation provides a solid foundation for populating your School Management database with realistic data for development and testing purposes.

## Logging System Implementation

The application implements a comprehensive logging system that captures request/response information and errors for monitoring and debugging purposes.

### Logger Middleware

The logger middleware captures all HTTP requests and responses, providing detailed timing and status information:

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Middleware to log requests
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Log request details
    console.log(
      `[\x1b[33m${new Date().toISOString()}\x1b[0m] \x1b[32m${req.method}\x1b[0m ${req.path}`,
    );

    // Capture the original end function
    const originalEnd = res.end.bind(res) as Response['end'];

    // Override the end function to log the status code
    res.end = function (...args: Parameters<Response['end']>): Response {
      const duration = Date.now() - startTime;
      console.log(
        `[\x1b[33m${new Date().toISOString()}\x1b[0m] \x1b[32m${req.method}\x1b[0m ${req.path} - ${res.statusCode} (\x1b[33m${duration}ms\x1b[0m)`,
      );

      // Call the original end function
      return originalEnd.apply(res, args) as Response;
    } as Response['end'];

    next();
  }
}
```

### Logs Service

The `LogsService` handles file-based logging for errors and important events:

```typescript
import { Injectable } from '@nestjs/common';
import { promises as fsPromises, existsSync } from 'fs';
import * as path from 'path';

@Injectable()
export class LogsService {
  async logToFile(entry: string, ip?: string) {
    const formattedEntry = `
 ${Intl.DateTimeFormat('en-US', {
   dateStyle: 'short',
   timeStyle: 'short',
   timeZone: 'Africa/Nairobi',
 }).format(new Date())} - IP: ${ip || 'unknown'} - ${entry}\n`;

    try {
      const logsPath = path.join(__dirname, '..', '..', 'applogs');
      if (!existsSync(logsPath)) {
        await fsPromises.mkdir(logsPath);
      }
      await fsPromises.appendFile(
        path.join(logsPath, 'myLogFile.log'),
        formattedEntry,
      );
    } catch (e) {
      if (e instanceof Error) console.error(e.message);
    }
  }
}
```

### Logs Module

The logs module makes the logging service available throughout the application:

```typescript
import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';

@Module({
  providers: [LogsService],
})
export class LogsModule {}
```

### Configuring Logger Middleware

The logger middleware is configured in the `AppModule` to monitor specific routes:

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('students', 'profiles', 'courses', 'lectures', 'departments');
  }
}
```

### Logging Features

1. **Console Logging**: All HTTP requests are logged to the console with colored output showing:
   * Timestamp
   * HTTP method
   * Request path
   * Response status code
   * Request duration in milliseconds

2. **File Logging**: Errors and important events are logged to files in the `applogs` directory:
   * Automatic directory creation if it doesn't exist
   * Formatted timestamps with timezone support
   * Client IP address tracking
   * Error message details

3. **Color-coded Output**: Console logs use ANSI color codes for better readability:
   * Yellow for timestamps
   * Green for HTTP methods
   * Duration in yellow

## Exception Filters Implementation

The application uses a global exception filter to handle all types of errors in a standardized way, providing consistent error responses and comprehensive error logging.

### All Exceptions Filter

The `AllExceptionsFilter` extends NestJS's `BaseExceptionFilter` to catch all exceptions:

```typescript
import {
  Catch,
  HttpException,
  HttpStatus,
  ArgumentsHost,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { LogsService } from './logs/logs.service';
import { Request, Response } from 'express';

// Interface for standardized error response
interface MyResponseObj {
  statusCode: number;
  timestamp: string;
  path: string;
  response: string | object;
}

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logs = new LogsService();

  private getClientIp(request: Request): string {
    // Get IP from X-Forwarded-For header or fall back to connection remote address
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // If it's an array or comma-separated string, get the first IP
      return Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0].trim();
    }
    return request.ip || 'unknown';
  }

  override catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const clientIp = this.getClientIp(request);

    const myResponseObj: MyResponseObj = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: '',
    };

    if (exception instanceof HttpException) {
      myResponseObj.statusCode = exception.getStatus();
      myResponseObj.response = exception.getResponse();
    } else if (exception instanceof Error) {
      myResponseObj.response = exception.message;
    } else {
      myResponseObj.response = 'Internal Server Error';
    }

    response.status(myResponseObj.statusCode).json(myResponseObj);

    const logMessage =
      typeof myResponseObj.response === 'string'
        ? myResponseObj.response
        : JSON.stringify(myResponseObj.response);
    
    // Log the error with client IP and path
    void this.logs.logToFile(
      `ERROR: ${logMessage} - Path: ${request.url}`,
      clientIp,
    );
  }
}
```

### Registering the Global Exception Filter

The exception filter is registered globally in the `main.ts` file:

```typescript
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const { httpAdapter } = app.get(HttpAdapterHost);
  // Register the global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const configService = app.get(ConfigService);
  const PORT = configService.getOrThrow<number>('PORT');

  await app.listen(PORT);
}
bootstrap();
```

### Exception Filter Features

1. **Standardized Error Response**: All errors return a consistent JSON structure:

   ```json
   {
     "statusCode": 404,
     "timestamp": "2024-01-15T10:30:00.000Z",
     "path": "/api/students/999",
     "response": "Student not found"
   }
   ```

2. **Client IP Tracking**: Extracts client IP addresses from:
   * `X-Forwarded-For` header (for proxy/load balancer scenarios)
   * Direct connection IP
   * Falls back to 'unknown' if IP cannot be determined

3. **Comprehensive Error Handling**: Handles different types of exceptions:
   * `HttpException`: Uses the exception's status code and response
   * `Error`: Uses the error message
   * Unknown exceptions: Returns generic "Internal Server Error"

4. **Error Logging**: All caught exceptions are logged to files with:
   * Error message details
   * Request path where the error occurred
   * Client IP address
   * Formatted timestamp

### Benefits of This Implementation

1. **Monitoring & Debugging**: Comprehensive logging helps identify issues quickly
2. **Security**: IP tracking helps identify potential security threats
3. **Consistency**: Standardized error responses improve API reliability
4. **Maintenance**: Centralized error handling reduces code duplication
5. **Performance Tracking**: Request timing helps identify performance bottlenecks

### Log File Structure

Error logs are stored in the `applogs/myLogFile.log` file with the following format:

```text
12/15/2024, 3:30 PM - IP: 192.168.1.100 - ERROR: Student not found - Path: /api/students/999
12/15/2024, 3:31 PM - IP: 10.0.0.50 - ERROR: Validation failed - Path: /api/students
```

This comprehensive logging and exception handling system ensures robust error management and provides valuable insights for application monitoring and debugging.
