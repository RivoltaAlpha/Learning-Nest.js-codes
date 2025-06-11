import { Test, TestingModule } from '@nestjs/testing';
import { LecturerService } from './lecturer.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Lecturer } from './entities/lecturer.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Course } from '../courses/entities/course.entity';
import { Department } from '../departments/entities/department.entity';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { Role } from '../profiles/entities/profile.entity';

describe('LecturerService', () => {
  let service: LecturerService;
  let lecturerRepository: Repository<Lecturer>;
  let profileRepository: Repository<Profile>;
  let courseRepository: Repository<Course>;

  // Mock data
  const mockDepartment = {
    id: 1,
    name: 'Computer Science Department',
    description: 'Department of Computer Science',
    headOfDepartment: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
    courses: [],
  } as Department;

  const mockProfile = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    role: Role.FACULTY,
    createdAt: new Date(),
    updatedAt: new Date(),
    hashedRefreshToken: null,
  } as Profile;

  const mockCourse = {
    id: 1,
    title: 'Introduction to Computer Science',
    description: 'Basic CS concepts',
    credits: 3,
    duration: '16 weeks',
    startDate: '2024-01-15',
    endDate: '2024-05-15',
    createdAt: new Date(),
    updatedAt: new Date(),
    department: mockDepartment,
    students: [],
    lecturers: [],
  } as Course;

  const mockLecturer = {
    id: 1,
    employeeId: 'EMP001',
    specialization: 'Computer Science',
    bio: 'Experienced CS professor',
    officeLocation: 'Room 101',
    phoneNumber: '+1-555-0123',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: mockProfile,
    courses: [mockCourse],
  } as Lecturer;

  const mockCreateLecturerDto: CreateLecturerDto = {
    employeeId: 'EMP001',
    specialization: 'Computer Science',
    bio: 'Experienced CS professor',
    officeLocation: 'Room 101',
    phoneNumber: '+1-555-0123',
    profileId: 1,
  };

  const mockUpdateLecturerDto: UpdateLecturerDto = {
    specialization: 'Advanced Computer Science',
    bio: 'Updated bio',
  };

  // Mock repositories
  const mockLecturerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockProfileRepository = {
    findOneBy: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCourseRepository = {
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LecturerService,
        {
          provide: getRepositoryToken(Lecturer),
          useValue: mockLecturerRepository,
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
      ],
    }).compile();

    service = module.get<LecturerService>(LecturerService);
    lecturerRepository = module.get<Repository<Lecturer>>(
      getRepositoryToken(Lecturer),
    );
    profileRepository = module.get<Repository<Profile>>(
      getRepositoryToken(Profile),
    );
    courseRepository = module.get<Repository<Course>>(
      getRepositoryToken(Course),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a lecturer successfully', async () => {
      mockProfileRepository.findOneBy.mockResolvedValue(mockProfile);
      mockLecturerRepository.create.mockReturnValue(mockLecturer);
      mockLecturerRepository.save.mockResolvedValue(mockLecturer);

      const result = await service.create(mockCreateLecturerDto);

      expect(mockProfileRepository.findOneBy).toHaveBeenCalledWith({
        id: mockCreateLecturerDto.profileId,
      });
      expect(mockLecturerRepository.create).toHaveBeenCalledWith({
        employeeId: mockCreateLecturerDto.employeeId,
        specialization: mockCreateLecturerDto.specialization,
        bio: mockCreateLecturerDto.bio,
        officeLocation: mockCreateLecturerDto.officeLocation,
        phoneNumber: mockCreateLecturerDto.phoneNumber,
        profile: mockProfile,
      });
      expect(mockLecturerRepository.save).toHaveBeenCalledWith(mockLecturer);
      expect(result).toEqual(mockLecturer);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockProfileRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(mockCreateLecturerDto)).rejects.toThrow(
        new NotFoundException(
          `Profile with ID ${mockCreateLecturerDto.profileId} not found`,
        ),
      );

      expect(mockProfileRepository.findOneBy).toHaveBeenCalledWith({
        id: mockCreateLecturerDto.profileId,
      });
      expect(mockLecturerRepository.create).not.toHaveBeenCalled();
      expect(mockLecturerRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all lecturers when no name is provided', async () => {
      const mockLecturers = [mockLecturer];
      mockLecturerRepository.find.mockResolvedValue(mockLecturers);

      const result = await service.findAll();

      expect(mockLecturerRepository.find).toHaveBeenCalledWith({
        relations: ['profile', 'courses'],
      });
      expect(result).toEqual(mockLecturers);
    });

    it('should return lecturers filtered by name when name is provided', async () => {
      const mockLecturers = [mockLecturer];
      mockLecturerRepository.find.mockResolvedValue(mockLecturers);

      const result = await service.findAll('John');

      expect(mockLecturerRepository.find).toHaveBeenCalledWith({
        where: {
          profile: {
            firstName: 'John',
          },
        },
        relations: ['profile', 'courses'],
      });
      expect(result).toEqual(mockLecturers);
    });
  });

  describe('findOne', () => {
    it('should return a lecturer when found', async () => {
      mockLecturerRepository.findOne.mockResolvedValue(mockLecturer);

      const result = await service.findOne(1);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['profile', 'courses'],
      });
      expect(result).toEqual(mockLecturer);
    });

    it('should return error message when lecturer not found', async () => {
      mockLecturerRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['profile', 'courses'],
      });
      expect(result).toBe('No lecturer found with id 999');
    });

    it('should throw error when database operation fails', async () => {
      const dbError = new Error('Database connection failed');
      mockLecturerRepository.findOne.mockRejectedValue(dbError);

      await expect(service.findOne(1)).rejects.toThrow(
        'Failed to find lecturer with id 1',
      );

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['profile', 'courses'],
      });
    });
  });

  describe('update', () => {
    it('should update lecturer successfully', async () => {
      const mockUpdateResult = { affected: 1 };
      mockLecturerRepository.update.mockResolvedValue(mockUpdateResult);

      const result = await service.update(1, mockUpdateLecturerDto);

      expect(mockLecturerRepository.update).toHaveBeenCalledWith(
        1,
        mockUpdateLecturerDto,
      );
      expect(result).toBeUndefined(); // Method returns undefined on success
    });

    it('should return error message when lecturer not found for update', async () => {
      const mockUpdateResult = { affected: 0 };
      mockLecturerRepository.update.mockResolvedValue(mockUpdateResult);

      const result = await service.update(999, mockUpdateLecturerDto);

      expect(mockLecturerRepository.update).toHaveBeenCalledWith(
        999,
        mockUpdateLecturerDto,
      );
      expect(result).toBe('No lecturer found with id 999');
    });

    it('should throw error when update operation fails', async () => {
      const dbError = new Error('Database update failed');
      mockLecturerRepository.update.mockRejectedValue(dbError);

      await expect(service.update(1, mockUpdateLecturerDto)).rejects.toThrow(
        'Failed to update lecturer with id 1',
      );

      expect(mockLecturerRepository.update).toHaveBeenCalledWith(
        1,
        mockUpdateLecturerDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove lecturer successfully', async () => {
      const mockDeleteResult = { affected: 1 };
      mockLecturerRepository.delete.mockResolvedValue(mockDeleteResult);

      const result = await service.remove(1);

      expect(mockLecturerRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe('Lecturer with id 1 has been removed');
    });

    it('should return error message when lecturer not found for deletion', async () => {
      const mockDeleteResult = { affected: 0 };
      mockLecturerRepository.delete.mockResolvedValue(mockDeleteResult);

      const result = await service.remove(999);

      expect(mockLecturerRepository.delete).toHaveBeenCalledWith(999);
      expect(result).toBe('No lecturer found with id 999');
    });

    it('should throw error when delete operation fails', async () => {
      const dbError = new Error('Database delete failed');
      mockLecturerRepository.delete.mockRejectedValue(dbError);

      await expect(service.remove(1)).rejects.toThrow(
        'Failed to remove lecturer with id 1',
      );

      expect(mockLecturerRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('assignLecturerToCourse', () => {
    it('should assign lecturer to course successfully', async () => {
      const lecturerWithoutCourse = { ...mockLecturer, courses: [] };
      const lecturerWithCourse = { ...mockLecturer, courses: [mockCourse] };

      mockLecturerRepository.findOne.mockResolvedValue(lecturerWithoutCourse);
      mockCourseRepository.findOneBy.mockResolvedValue(mockCourse);
      mockLecturerRepository.save.mockResolvedValue(lecturerWithCourse);

      const result = await service.assignLecturerToCourse(1, 1);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(mockCourseRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockLecturerRepository.save).toHaveBeenCalledWith({
        ...lecturerWithoutCourse,
        courses: [mockCourse],
      });
      expect(result).toEqual(lecturerWithCourse);
    });

    it('should not assign if lecturer is already assigned to the course', async () => {
      const lecturerWithCourse = { ...mockLecturer, courses: [mockCourse] };

      mockLecturerRepository.findOne.mockResolvedValue(lecturerWithCourse);
      mockCourseRepository.findOneBy.mockResolvedValue(mockCourse);
      mockLecturerRepository.save.mockResolvedValue(lecturerWithCourse);

      const result = await service.assignLecturerToCourse(1, 1);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(mockCourseRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockLecturerRepository.save).not.toHaveBeenCalled(); // Should not save if already assigned
      expect(result).toEqual(lecturerWithCourse);
    });

    it('should handle lecturer with undefined courses array', async () => {
      const lecturerWithUndefinedCourses = {
        ...mockLecturer,
        courses: undefined,
      };
      const lecturerWithCourse = { ...mockLecturer, courses: [mockCourse] };

      mockLecturerRepository.findOne.mockResolvedValue(
        lecturerWithUndefinedCourses,
      );
      mockCourseRepository.findOneBy.mockResolvedValue(mockCourse);
      mockLecturerRepository.save.mockResolvedValue(lecturerWithCourse);

      const result = await service.assignLecturerToCourse(1, 1);

      expect(mockLecturerRepository.save).toHaveBeenCalledWith({
        ...lecturerWithUndefinedCourses,
        courses: [mockCourse],
      });
      expect(result).toEqual(lecturerWithCourse);
    });

    it('should throw NotFoundException when lecturer does not exist', async () => {
      mockLecturerRepository.findOne.mockResolvedValue(null);

      await expect(service.assignLecturerToCourse(999, 1)).rejects.toThrow(
        new NotFoundException('Lecturer with ID 999 not found'),
      );

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['courses'],
      });
      expect(mockCourseRepository.findOneBy).not.toHaveBeenCalled();
      expect(mockLecturerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockLecturerRepository.findOne.mockResolvedValue(mockLecturer);
      mockCourseRepository.findOneBy.mockResolvedValue(null);

      await expect(service.assignLecturerToCourse(1, 999)).rejects.toThrow(
        new NotFoundException('Course with ID 999 not found'),
      );

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(mockCourseRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(mockLecturerRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('unassignLecturerFromCourse', () => {
    it('should unassign lecturer from course successfully', async () => {
      const lecturerWithCourse = { ...mockLecturer, courses: [mockCourse] };
      const lecturerWithoutCourse = { ...mockLecturer, courses: [] };

      mockLecturerRepository.findOne.mockResolvedValue(lecturerWithCourse);
      mockLecturerRepository.save.mockResolvedValue(lecturerWithoutCourse);

      const result = await service.unassignLecturerFromCourse(1, 1);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(mockLecturerRepository.save).toHaveBeenCalledWith({
        ...lecturerWithCourse,
        courses: [],
      });
      expect(result).toEqual(lecturerWithoutCourse);
    });

    it('should throw NotFoundException when lecturer does not exist', async () => {
      mockLecturerRepository.findOne.mockResolvedValue(null);

      await expect(service.unassignLecturerFromCourse(999, 1)).rejects.toThrow(
        new NotFoundException('Lecturer with ID 999 not found'),
      );

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['courses'],
      });
      expect(mockLecturerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when lecturer has no courses', async () => {
      const lecturerWithNoCourses = { ...mockLecturer, courses: [] };
      mockLecturerRepository.findOne.mockResolvedValue(lecturerWithNoCourses);

      await expect(service.unassignLecturerFromCourse(1, 1)).rejects.toThrow(
        new NotFoundException(
          'Lecturer with ID 1 is not assigned to any courses',
        ),
      );

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(mockLecturerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when lecturer has undefined courses', async () => {
      const lecturerWithUndefinedCourses = {
        ...mockLecturer,
        courses: undefined,
      };
      mockLecturerRepository.findOne.mockResolvedValue(
        lecturerWithUndefinedCourses,
      );

      await expect(service.unassignLecturerFromCourse(1, 1)).rejects.toThrow(
        new NotFoundException(
          'Lecturer with ID 1 is not assigned to any courses',
        ),
      );

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(mockLecturerRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getLecturerCourses', () => {
    it('should return lecturer courses successfully', async () => {
      mockLecturerRepository.findOne.mockResolvedValue(mockLecturer);

      const result = await service.getLecturerCourses(1);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(result).toEqual(mockLecturer.courses);
    });

    it('should return empty array when lecturer has no courses', async () => {
      const lecturerWithNoCourses = { ...mockLecturer, courses: [] };
      mockLecturerRepository.findOne.mockResolvedValue(lecturerWithNoCourses);

      const result = await service.getLecturerCourses(1);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(result).toEqual([]);
    });

    it('should return empty array when lecturer courses is undefined', async () => {
      const lecturerWithUndefinedCourses = {
        ...mockLecturer,
        courses: undefined,
      };
      mockLecturerRepository.findOne.mockResolvedValue(
        lecturerWithUndefinedCourses,
      );

      const result = await service.getLecturerCourses(1);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when lecturer does not exist', async () => {
      mockLecturerRepository.findOne.mockResolvedValue(null);

      await expect(service.getLecturerCourses(999)).rejects.toThrow(
        new NotFoundException('Lecturer with ID 999 not found'),
      );

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['courses'],
      });
    });
  });

  describe('updateLecturerCourses', () => {
    const mockCourse2 = {
      id: 2,
      title: 'Advanced Computer Science',
      description: 'Advanced CS concepts',
      credits: 4,
      duration: '16 weeks',
      startDate: '2024-01-15',
      endDate: '2024-05-15',
      createdAt: new Date(),
      updatedAt: new Date(),
      department: mockDepartment,
      students: [],
      lecturers: [],
    } as Course;

    it('should update lecturer courses successfully', async () => {
      const courseIds = [1, 2];
      const newCourses = [mockCourse, mockCourse2];
      const updatedLecturer = { ...mockLecturer, courses: newCourses };

      mockLecturerRepository.findOne.mockResolvedValue(mockLecturer);
      mockCourseRepository.findBy.mockResolvedValue(newCourses);
      mockLecturerRepository.save.mockResolvedValue(updatedLecturer);

      const result = await service.updateLecturerCourses(1, courseIds);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(mockCourseRepository.findBy).toHaveBeenCalledWith({
        id: { $in: courseIds }, // Using In() from typeorm
      });
      expect(mockLecturerRepository.save).toHaveBeenCalledWith({
        ...mockLecturer,
        courses: newCourses,
      });
      expect(result).toEqual(updatedLecturer);
    });

    it('should throw NotFoundException when lecturer does not exist', async () => {
      mockLecturerRepository.findOne.mockResolvedValue(null);

      await expect(service.updateLecturerCourses(999, [1, 2])).rejects.toThrow(
        new NotFoundException('Lecturer with ID 999 not found'),
      );

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['courses'],
      });
      expect(mockCourseRepository.findBy).not.toHaveBeenCalled();
      expect(mockLecturerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when some courses do not exist', async () => {
      const courseIds = [1, 2, 999];
      const foundCourses = [mockCourse, mockCourse2]; // Only 2 out of 3 courses found

      mockLecturerRepository.findOne.mockResolvedValue(mockLecturer);
      mockCourseRepository.findBy.mockResolvedValue(foundCourses);

      await expect(service.updateLecturerCourses(1, courseIds)).rejects.toThrow(
        new NotFoundException('Courses with IDs 999 not found'),
      );

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(mockCourseRepository.findBy).toHaveBeenCalledWith({
        id: { $in: courseIds },
      });
      expect(mockLecturerRepository.save).not.toHaveBeenCalled();
    });

    it('should handle empty course IDs array', async () => {
      const updatedLecturer = { ...mockLecturer, courses: [] };

      mockLecturerRepository.findOne.mockResolvedValue(mockLecturer);
      mockCourseRepository.findBy.mockResolvedValue([]);
      mockLecturerRepository.save.mockResolvedValue(updatedLecturer);

      const result = await service.updateLecturerCourses(1, []);

      expect(mockLecturerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['courses'],
      });
      expect(mockCourseRepository.findBy).toHaveBeenCalledWith({
        id: { $in: [] },
      });
      expect(mockLecturerRepository.save).toHaveBeenCalledWith({
        ...mockLecturer,
        courses: [],
      });
      expect(result).toEqual(updatedLecturer);
    });
  });
});
