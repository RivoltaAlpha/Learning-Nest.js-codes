import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Student } from '../students/entities/student.entity';
import { Profile, Role } from '../profiles/entities/profile.entity';
import { Department } from '../departments/entities/department.entity';
import { Course } from '../courses/entities/course.entity';
import { Lecturer } from '../lecturer/entities/lecturer.entity';

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
    @InjectRepository(Lecturer)
    private readonly lecturerRepository: Repository<Lecturer>,
    private readonly dataSource: DataSource,
  ) {}

  async seed() {
    this.logger.log('Starting the seeding process...');

    try {
      // Clear all tables in the correct order to avoid foreign key constraints
      this.logger.log('Clearing existing data...');

      // Using QueryRunner for transaction support
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Order matters due to foreign key relationships
        await queryRunner.query('DELETE FROM lecturer_courses_course'); // Delete from lecturer-course junction table first
        await queryRunner.query('DELETE FROM student_courses_course'); // Delete from student-course junction table
        await queryRunner.query('DELETE FROM student'); // Student has FK to Profile
        await queryRunner.query('DELETE FROM lecturer'); // Lecturer has FK to Profile
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

      // Seed departments
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

      // Seed courses
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

        // Generate random date for the course in the past year
        const startDate = faker.date.past({ years: 1 });
        const endDate = new Date(startDate);
        endDate.setMonth(
          endDate.getMonth() + faker.number.int({ min: 3, max: 6 }),
        );

        course.startDate = startDate.toISOString().split('T')[0];
        course.endDate = endDate.toISOString().split('T')[0];

        // Assign a random department to this course
        course.department =
          departments[
            faker.number.int({ min: 0, max: departments.length - 1 })
          ];

        courses.push(await this.courseRepository.save(course));
      }
      this.logger.log(`Created ${courses.length} courses`);

      // Seed lecturers - Changed to 10 lecturers as requested
      this.logger.log('Seeding lecturers...');
      const lecturers: Lecturer[] = [];
      const specializations = [
        'Computer Science',
        'Software Engineering',
        'Data Science',
        'Machine Learning',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Psychology',
        'Business Administration',
        'Marketing',
        'Finance',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
      ];

      for (let i = 0; i < 10; i++) {
        // Create profile for lecturer
        const profile = new Profile();
        profile.firstName = faker.person.firstName();
        profile.lastName = faker.person.lastName();
        profile.email = faker.internet.email({
          firstName: profile.firstName,
          lastName: profile.lastName,
          provider: 'university.edu',
        });
        profile.password = 'password'; // Default password for seeding
        profile.role = Role.FACULTY;

        // Save the profile
        const savedProfile = await this.profileRepository.save(profile);

        // Create lecturer linked to the profile
        const lecturer = new Lecturer();
        lecturer.employeeId = `EMP${faker.number.int({ min: 1000, max: 9999 })}`;
        lecturer.specialization =
          specializations[
            faker.number.int({ min: 0, max: specializations.length - 1 })
          ];
        lecturer.bio = faker.lorem.paragraph();
        lecturer.officeLocation = `Room ${faker.number.int({ min: 100, max: 999 })}`;
        lecturer.phoneNumber = faker.phone.number();

        // Link profile to lecturer
        lecturer.profile = savedProfile;

        // Save the lecturer
        const savedLecturer = await this.lecturerRepository.save(lecturer);

        // Assign random courses to the lecturer (between 2 and 5 courses)
        const numberOfCourses = faker.number.int({ min: 2, max: 5 });
        const lecturerCourses: Course[] = [];

        const availableCourses = [...courses]; // Copy courses to avoid modifying the original array

        for (let j = 0; j < numberOfCourses; j++) {
          if (availableCourses.length === 0) break;

          const randomIndex = faker.number.int({
            min: 0,
            max: availableCourses.length - 1,
          });
          const selectedCourse = availableCourses.splice(randomIndex, 1)[0]; // Remove the selected course

          lecturerCourses.push(selectedCourse);
        }

        // Update the lecturer's courses
        savedLecturer.courses = lecturerCourses;
        await this.lecturerRepository.save(savedLecturer);

        lecturers.push(savedLecturer);
      }
      this.logger.log(`Created ${lecturers.length} lecturers with profiles`);

      // Seed profiles and students - Already 20 students as requested
      this.logger.log('Seeding profiles and students...');
      const students: Student[] = [];

      for (let i = 0; i < 20; i++) {
        // Create profile
        const profile = new Profile();
        profile.firstName = faker.person.firstName();
        profile.lastName = faker.person.lastName();
        profile.email = faker.internet.email({
          firstName: profile.firstName,
          lastName: profile.lastName,
          provider: 'university.edu',
        });
        profile.password = 'password'; // Default password for seeding
        profile.role = Role.STUDENT; // Fixed: was incomplete

        // Save the profile
        const savedProfile = await this.profileRepository.save(profile);

        // Create student linked to the profile
        const student = new Student();

        // Generate a random enrollment date in the past 4 years
        const enrollmentDate = faker.date.past({ years: 4 });
        student.enrollmentDate = enrollmentDate.toISOString().split('T')[0];

        // Pick a degree program
        const degreePrograms = [
          'Bachelor of Science',
          'Bachelor of Arts',
          'Master of Science',
          'PhD',
        ];
        student.degreeProgram =
          degreePrograms[
            faker.number.int({ min: 0, max: degreePrograms.length - 1 })
          ];

        // Generate a random GPA between 2.0 and 4.0
        student.gpa = parseFloat(
          faker.number
            .float({ min: 2.0, max: 4.0, fractionDigits: 2 })
            .toFixed(2),
        );

        // Link profile to student
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

      this.logger.log('Seeding completed successfully');
      return { message: 'Database seeded successfully' };
    } catch (error) {
      this.logger.error('Error during seeding:', error);
      throw error;
    }
  }
}
