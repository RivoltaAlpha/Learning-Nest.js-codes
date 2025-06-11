import { Test, TestingModule } from '@nestjs/testing';
import { LecturerController } from './lecturer.controller';
import { LecturerService } from './lecturer.service';
import { CreateLecturerDto, UpdateLecturerDto } from './dto';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { Role } from '../profiles/entities/profile.entity';

describe('LecturerController', () => {
  let controller: LecturerController;

  // Mock data
  const mockProfile = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: Role.FACULTY,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLecturer = {
    id: 1,
    employeeId: 'EMP001',
    specialization: 'Computer Science',
    bio: 'Test bio',
    officeLocation: 'Room 101',
    phoneNumber: '123456789',
    profile: mockProfile,
    courses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCourse = {
    id: 1,
    title: 'Test Course',
    description: 'Test Description',
    credits: 3,
    duration: 120,
    startDate: new Date(),
    endDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock services
  const mockLecturerService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getLecturerCourses: jest.fn(),
    assignLecturerToCourse: jest.fn(),
    unassignLecturerFromCourse: jest.fn(),
    updateLecturerCourses: jest.fn(),
  };

  const mockProfileRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LecturerController],
      providers: [
        {
          provide: LecturerService,
          useValue: mockLecturerService,
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(true),
            get: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    controller = module.get<LecturerController>(LecturerController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new lecturer', async () => {
      const createLecturerDto: CreateLecturerDto = {
        employeeId: 'EMP001',
        specialization: 'Computer Science',
        bio: 'Test bio',
        officeLocation: 'Room 101',
        phoneNumber: '123456789',
        profileId: 1,
      };

      mockLecturerService.create.mockResolvedValue(mockLecturer);

      const result = await controller.create(createLecturerDto);

      expect(mockLecturerService.create).toHaveBeenCalledWith(
        createLecturerDto,
      );
      expect(result).toEqual(mockLecturer);
    });

    it('should handle service errors', async () => {
      const createLecturerDto: CreateLecturerDto = {
        employeeId: 'EMP001',
        specialization: 'Computer Science',
        profileId: 1,
      };

      const error = new Error('Profile not found');
      mockLecturerService.create.mockRejectedValue(error);

      await expect(controller.create(createLecturerDto)).rejects.toThrow(error);
      expect(mockLecturerService.create).toHaveBeenCalledWith(
        createLecturerDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return all lecturers when no name is provided', async () => {
      const lecturers = [mockLecturer];
      mockLecturerService.findAll.mockResolvedValue(lecturers);

      const result = await controller.findAll();

      expect(mockLecturerService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(lecturers);
    });

    it('should return filtered lecturers when name is provided', async () => {
      const lecturers = [mockLecturer];
      const name = 'John';
      mockLecturerService.findAll.mockResolvedValue(lecturers);

      const result = await controller.findAll(name);

      expect(mockLecturerService.findAll).toHaveBeenCalledWith(name);
      expect(result).toEqual(lecturers);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockLecturerService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    it('should return a lecturer by id', async () => {
      mockLecturerService.findOne.mockResolvedValue(mockLecturer);

      const result = await controller.findOne(1);

      expect(mockLecturerService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLecturer);
    });

    it('should return error message when lecturer is not found', async () => {
      const errorMessage = 'No lecturer found with id 999';
      mockLecturerService.findOne.mockResolvedValue(errorMessage);

      const result = await controller.findOne(999);

      expect(mockLecturerService.findOne).toHaveBeenCalledWith(999);
      expect(result).toEqual(errorMessage);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockLecturerService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(1)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    it('should update a lecturer', async () => {
      const updateLecturerDto: UpdateLecturerDto = {
        bio: 'Updated bio',
        officeLocation: 'Room 202',
      };

      mockLecturerService.update.mockResolvedValue(undefined);

      const result = await controller.update(1, updateLecturerDto);

      expect(mockLecturerService.update).toHaveBeenCalledWith(
        1,
        updateLecturerDto,
      );
      expect(result).toBeUndefined();
    });

    it('should return error message when lecturer is not found', async () => {
      const updateLecturerDto: UpdateLecturerDto = {
        bio: 'Updated bio',
      };
      const errorMessage = 'No lecturer found with id 999';
      mockLecturerService.update.mockResolvedValue(errorMessage);

      const result = await controller.update(999, updateLecturerDto);

      expect(mockLecturerService.update).toHaveBeenCalledWith(
        999,
        updateLecturerDto,
      );
      expect(result).toEqual(errorMessage);
    });

    it('should handle service errors', async () => {
      const updateLecturerDto: UpdateLecturerDto = {
        bio: 'Updated bio',
      };
      const error = new Error('Database error');
      mockLecturerService.update.mockRejectedValue(error);

      await expect(controller.update(1, updateLecturerDto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('remove', () => {
    it('should remove a lecturer', async () => {
      const successMessage = 'Lecturer with id 1 has been removed';
      mockLecturerService.remove.mockResolvedValue(successMessage);

      const result = await controller.remove(1);

      expect(mockLecturerService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(successMessage);
    });

    it('should return error message when lecturer is not found', async () => {
      const errorMessage = 'No lecturer found with id 999';
      mockLecturerService.remove.mockResolvedValue(errorMessage);

      const result = await controller.remove(999);

      expect(mockLecturerService.remove).toHaveBeenCalledWith(999);
      expect(result).toEqual(errorMessage);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockLecturerService.remove.mockRejectedValue(error);

      await expect(controller.remove(1)).rejects.toThrow(error);
    });
  });

  describe('getLecturerCourses', () => {
    it('should return courses for a lecturer', async () => {
      const courses = [mockCourse];
      mockLecturerService.getLecturerCourses.mockResolvedValue(courses);

      const result = await controller.getLecturerCourses(1);

      expect(mockLecturerService.getLecturerCourses).toHaveBeenCalledWith(1);
      expect(result).toEqual(courses);
    });

    it('should return empty array when lecturer has no courses', async () => {
      mockLecturerService.getLecturerCourses.mockResolvedValue([]);

      const result = await controller.getLecturerCourses(1);

      expect(mockLecturerService.getLecturerCourses).toHaveBeenCalledWith(1);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Lecturer not found');
      mockLecturerService.getLecturerCourses.mockRejectedValue(error);

      await expect(controller.getLecturerCourses(999)).rejects.toThrow(error);
    });
  });

  describe('assignLecturerToCourse', () => {
    it('should assign a lecturer to a course', async () => {
      const lecturerWithCourse = { ...mockLecturer, courses: [mockCourse] };
      mockLecturerService.assignLecturerToCourse.mockResolvedValue(
        lecturerWithCourse,
      );

      const result = await controller.assignLecturerToCourse(1, 1);

      expect(mockLecturerService.assignLecturerToCourse).toHaveBeenCalledWith(
        1,
        1,
      );
      expect(result).toEqual(lecturerWithCourse);
    });

    it('should handle assignment to non-existent lecturer', async () => {
      const error = new Error('Lecturer with ID 999 not found');
      mockLecturerService.assignLecturerToCourse.mockRejectedValue(error);

      await expect(controller.assignLecturerToCourse(999, 1)).rejects.toThrow(
        error,
      );
    });

    it('should handle assignment to non-existent course', async () => {
      const error = new Error('Course with ID 999 not found');
      mockLecturerService.assignLecturerToCourse.mockRejectedValue(error);

      await expect(controller.assignLecturerToCourse(1, 999)).rejects.toThrow(
        error,
      );
    });

    it('should handle duplicate assignment gracefully', async () => {
      const lecturerWithCourse = { ...mockLecturer, courses: [mockCourse] };
      mockLecturerService.assignLecturerToCourse.mockResolvedValue(
        lecturerWithCourse,
      );

      const result = await controller.assignLecturerToCourse(1, 1);

      expect(mockLecturerService.assignLecturerToCourse).toHaveBeenCalledWith(
        1,
        1,
      );
      expect(result).toEqual(lecturerWithCourse);
    });
  });

  describe('unassignLecturerFromCourse', () => {
    it('should unassign a lecturer from a course', async () => {
      const lecturerWithoutCourse = { ...mockLecturer, courses: [] };
      mockLecturerService.unassignLecturerFromCourse.mockResolvedValue(
        lecturerWithoutCourse,
      );

      const result = await controller.unassignLecturerFromCourse(1, 1);

      expect(
        mockLecturerService.unassignLecturerFromCourse,
      ).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(lecturerWithoutCourse);
    });

    it('should handle unassignment from non-existent lecturer', async () => {
      const error = new Error('Lecturer with ID 999 not found');
      mockLecturerService.unassignLecturerFromCourse.mockRejectedValue(error);

      await expect(
        controller.unassignLecturerFromCourse(999, 1),
      ).rejects.toThrow(error);
    });

    it('should handle unassignment when lecturer has no courses', async () => {
      const error = new Error(
        'Lecturer with ID 1 is not assigned to any courses',
      );
      mockLecturerService.unassignLecturerFromCourse.mockRejectedValue(error);

      await expect(controller.unassignLecturerFromCourse(1, 1)).rejects.toThrow(
        error,
      );
    });
  });

  describe('updateLecturerCourses', () => {
    it('should update lecturer courses in batch', async () => {
      const courseIds = [1, 2];
      const lecturerWithCourses = {
        ...mockLecturer,
        courses: [
          { ...mockCourse, id: 1 },
          { ...mockCourse, id: 2 },
        ],
      };
      mockLecturerService.updateLecturerCourses.mockResolvedValue(
        lecturerWithCourses,
      );

      const result = await controller.updateLecturerCourses(1, courseIds);

      expect(mockLecturerService.updateLecturerCourses).toHaveBeenCalledWith(
        1,
        courseIds,
      );
      expect(result).toEqual(lecturerWithCourses);
    });

    it('should handle empty course list', async () => {
      const courseIds: number[] = [];
      const lecturerWithNoCourses = { ...mockLecturer, courses: [] };
      mockLecturerService.updateLecturerCourses.mockResolvedValue(
        lecturerWithNoCourses,
      );

      const result = await controller.updateLecturerCourses(1, courseIds);

      expect(mockLecturerService.updateLecturerCourses).toHaveBeenCalledWith(
        1,
        courseIds,
      );
      expect(result).toEqual(lecturerWithNoCourses);
    });

    it('should handle non-existent lecturer', async () => {
      const courseIds = [1, 2];
      const error = new Error('Lecturer with ID 999 not found');
      mockLecturerService.updateLecturerCourses.mockRejectedValue(error);

      await expect(
        controller.updateLecturerCourses(999, courseIds),
      ).rejects.toThrow(error);
    });

    it('should handle non-existent courses', async () => {
      const courseIds = [1, 999];
      const error = new Error('Courses with IDs 999 not found');
      mockLecturerService.updateLecturerCourses.mockRejectedValue(error);

      await expect(
        controller.updateLecturerCourses(1, courseIds),
      ).rejects.toThrow(error);
    });

    it('should handle partial course updates', async () => {
      const courseIds = [1];
      const lecturerWithOneCourse = {
        ...mockLecturer,
        courses: [{ ...mockCourse, id: 1 }],
      };
      mockLecturerService.updateLecturerCourses.mockResolvedValue(
        lecturerWithOneCourse,
      );

      const result = await controller.updateLecturerCourses(1, courseIds);

      expect(mockLecturerService.updateLecturerCourses).toHaveBeenCalledWith(
        1,
        courseIds,
      );
      expect(result).toEqual(lecturerWithOneCourse);
    });
  });

  // FAILING TESTS - These are intentionally designed to fail
  //   describe('Failing Tests - Demonstrating Test Scenarios', () => {
  //     describe('create - failing scenarios', () => {
  //       it('should fail - expecting wrong return value', async () => {
  //         const createLecturerDto: CreateLecturerDto = {
  //           employeeId: 'EMP001',
  //           specialization: 'Computer Science',
  //           bio: 'Test bio',
  //           officeLocation: 'Room 101',
  //           phoneNumber: '123456789',
  //           profileId: 1,
  //         };

  //         mockLecturerService.create.mockResolvedValue(mockLecturer);

  //         const result = await controller.create(createLecturerDto);

  //         // This will fail - expecting wrong employeeId
  //         expect(result.employeeId).toBe('EMP999'); // Should be 'EMP001'
  //       });

  //       it('should fail - missing service call verification', async () => {
  //         const createLecturerDto: CreateLecturerDto = {
  //           employeeId: 'EMP001',
  //           specialization: 'Computer Science',
  //           profileId: 1,
  //         };

  //         mockLecturerService.create.mockResolvedValue(mockLecturer);

  //         await controller.create(createLecturerDto);

  //         // This will fail - expecting service to be called with wrong parameters
  //         expect(mockLecturerService.create).toHaveBeenCalledWith({
  //           ...createLecturerDto,
  //           employeeId: 'WRONG_ID', // Wrong expected parameter
  //         });
  //       });
  //     });

  //     describe('findAll - failing scenarios', () => {
  //       it('should fail - expecting wrong array length', async () => {
  //         const lecturers = [mockLecturer];
  //         mockLecturerService.findAll.mockResolvedValue(lecturers);

  //         const result = await controller.findAll();

  //         // This will fail - expecting wrong length
  //         expect(result).toHaveLength(5); // Should be 1
  //       });

  //       it('should fail - expecting wrong data structure', async () => {
  //         const lecturers = [mockLecturer];
  //         mockLecturerService.findAll.mockResolvedValue(lecturers);

  //         const result = await controller.findAll();

  //         // This will fail - expecting object instead of array
  //         expect(result).toEqual(mockLecturer); // Should be [mockLecturer]
  //       });
  //     });

  //     describe('findOne - failing scenarios', () => {
  //       it('should fail - expecting lecturer to have wrong properties', async () => {
  //         mockLecturerService.findOne.mockResolvedValue(mockLecturer);

  //         const result = await controller.findOne(1);

  //         // This will fail - expecting property that doesn't exist
  //         expect(result).toHaveProperty('salary'); // Lecturer doesn't have salary property
  //       });

  //       it('should fail - not handling async properly', () => {
  //         mockLecturerService.findOne.mockResolvedValue(mockLecturer);

  //         // This will fail - missing await
  //         const result = controller.findOne(1); // Missing await

  //         expect(result).toEqual(mockLecturer); // Will compare Promise with object
  //       });
  //     });

  //     describe('update - failing scenarios', () => {
  //       it('should fail - expecting update to return modified object', async () => {
  //         const updateLecturerDto: UpdateLecturerDto = {
  //           bio: 'Updated bio',
  //           officeLocation: 'Room 202',
  //         };

  //         // Service returns undefined for update
  //         mockLecturerService.update.mockResolvedValue(undefined);

  //         const result = await controller.update(1, updateLecturerDto);

  //         // This will fail - expecting object but gets undefined
  //         expect(result).toEqual({
  //           ...mockLecturer,
  //           ...updateLecturerDto,
  //         });
  //       });
  //     });

  //     describe('remove - failing scenarios', () => {
  //       it('should fail - expecting wrong success message', async () => {
  //         const successMessage = 'Lecturer with id 1 has been removed';
  //         mockLecturerService.remove.mockResolvedValue(successMessage);

  //         const result = await controller.remove(1);

  //         // This will fail - expecting different message format
  //         expect(result).toBe('Lecturer 1 deleted successfully'); // Wrong message
  //       });
  //     });

  //     describe('assignLecturerToCourse - failing scenarios', () => {
  //       it('should fail - expecting course assignment to persist incorrectly', async () => {
  //         const lecturerWithCourse = { ...mockLecturer, courses: [mockCourse] };
  //         mockLecturerService.assignLecturerToCourse.mockResolvedValue(
  //           lecturerWithCourse,
  //         );

  //         const result = await controller.assignLecturerToCourse(1, 1);

  //         // This will fail - expecting multiple courses but only one was assigned
  //         expect(result.courses).toHaveLength(2); // Should be 1
  //       });

  //       it('should fail - expecting wrong course data', async () => {
  //         const lecturerWithCourse = { ...mockLecturer, courses: [mockCourse] };
  //         mockLecturerService.assignLecturerToCourse.mockResolvedValue(
  //           lecturerWithCourse,
  //         );

  //         const result = await controller.assignLecturerToCourse(1, 1);

  //         // This will fail - expecting wrong course title
  //         expect(result.courses[0].title).toBe('Advanced Course'); // Should be 'Test Course'
  //       });
  //     });

  //     describe('updateLecturerCourses - failing scenarios', () => {
  //       it('should fail - expecting service to be called with wrong parameters', async () => {
  //         const courseIds = [1, 2];
  //         const lecturerWithCourses = {
  //           ...mockLecturer,
  //           courses: [
  //             { ...mockCourse, id: 1 },
  //             { ...mockCourse, id: 2 },
  //           ],
  //         };
  //         mockLecturerService.updateLecturerCourses.mockResolvedValue(
  //           lecturerWithCourses,
  //         );

  //         await controller.updateLecturerCourses(1, courseIds);

  //         // This will fail - expecting service to be called with wrong lecturer ID
  //         expect(mockLecturerService.updateLecturerCourses).toHaveBeenCalledWith(
  //           999, // Wrong lecturer ID
  //           courseIds,
  //         );
  //       });

  //       it('should fail - mock not configured properly', async () => {
  //         const courseIds = [1, 2];

  //         // Intentionally not mocking the service response
  //         // mockLecturerService.updateLecturerCourses.mockResolvedValue(...);

  //         const result = await controller.updateLecturerCourses(1, courseIds);

  //         // This will fail - service mock returns undefined by default
  //         expect(result).toHaveProperty('courses');
  //         expect(result.courses).toHaveLength(2);
  //       });
  //     });

  //     describe('Type checking failures', () => {
  //       it('should fail - wrong type expectations', async () => {
  //         mockLecturerService.findOne.mockResolvedValue(mockLecturer);

  //         const result = await controller.findOne(1);

  //         // This will fail - expecting string but lecturer ID is number
  //         // TypeScript fix: check the type properly since findOne can return string | Lecturer
  //         if (typeof result === 'object' && result !== null) {
  //           expect(typeof result.id).toBe('string'); // Should be 'number'
  //         }
  //       });

  //       it('should fail - date comparison issues', async () => {
  //         mockLecturerService.findOne.mockResolvedValue(mockLecturer);

  //         const result = await controller.findOne(1);

  //         // This will fail - comparing with wrong date
  //         // TypeScript fix: check the type properly since findOne can return string | Lecturer
  //         if (typeof result === 'object' && result !== null) {
  //           expect(result.createdAt).toEqual(new Date('2024-01-01')); // Will be different
  //         }
  //       });
  //     });

  //     describe('Mock verification failures', () => {
  //       it('should fail - expecting more calls than actually made', async () => {
  //         mockLecturerService.findAll.mockResolvedValue([mockLecturer]);

  //         await controller.findAll();

  //         // This will fail - expecting 2 calls but only 1 was made
  //         expect(mockLecturerService.findAll).toHaveBeenCalledTimes(2);
  //       });

  //       it('should fail - expecting calls that were never made', async () => {
  //         mockLecturerService.findAll.mockResolvedValue([mockLecturer]);

  //         await controller.findAll();

  //         // This will fail - create was never called
  //         expect(mockLecturerService.create).toHaveBeenCalled();
  //       });
  //     });
  //   });
});
