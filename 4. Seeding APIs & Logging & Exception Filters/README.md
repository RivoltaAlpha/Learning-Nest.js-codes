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
