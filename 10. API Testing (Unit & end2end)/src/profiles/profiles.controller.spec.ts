import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from './entities/profile.entity';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';

describe('ProfilesController', () => {
  let controller: ProfilesController;

  // Mock data
  const mockProfile = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: Role.STUDENT,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: null,
  };

  const mockPartialProfile = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: Role.STUDENT,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: null,
  };

  const mockCreateProfileDto: CreateProfileDto = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: Role.STUDENT,
  };

  const mockUpdateProfileDto: UpdateProfileDto = {
    firstName: 'Jane',
    lastName: 'Smith',
  };

  // Mock service
  const mockProfilesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: mockProfilesService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAll: jest.fn(),
            getAllAndMerge: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // ===============================
  // PASSING TESTS (Functional Tests)
  // ===============================

  describe('create', () => {
    it('should create a new profile successfully', async () => {
      mockProfilesService.create.mockResolvedValue(mockPartialProfile);

      const result = await controller.create(mockCreateProfileDto);

      expect(mockProfilesService.create).toHaveBeenCalledWith(
        mockCreateProfileDto,
      );
      expect(mockProfilesService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPartialProfile);
      expect(result).not.toHaveProperty('password');
    });

    it('should handle profile creation with ADMIN role', async () => {
      const adminProfile = { ...mockPartialProfile, role: Role.ADMIN };
      const adminDto = { ...mockCreateProfileDto, role: Role.ADMIN };
      mockProfilesService.create.mockResolvedValue(adminProfile);

      const result = await controller.create(adminDto);

      expect(mockProfilesService.create).toHaveBeenCalledWith(adminDto);
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should handle profile creation with GUEST role (default)', async () => {
      const guestProfile = { ...mockPartialProfile, role: Role.GUEST };
      const guestDto: CreateProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: Role.GUEST,
      };
      mockProfilesService.create.mockResolvedValue(guestProfile);

      const result = await controller.create(guestDto);

      expect(mockProfilesService.create).toHaveBeenCalledWith(guestDto);
      expect(result).toEqual(guestProfile);
    });
  });

  describe('findAll', () => {
    it('should return all profiles when no email filter is provided', async () => {
      const profiles = [
        mockPartialProfile,
        { ...mockPartialProfile, id: 2, email: 'jane@example.com' },
      ];
      mockProfilesService.findAll.mockResolvedValue(profiles);

      const result = await controller.findAll();

      expect(mockProfilesService.findAll).toHaveBeenCalledWith(undefined);
      expect(mockProfilesService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(profiles);
      expect(result).toHaveLength(2);
    });

    it('should return filtered profiles when email is provided', async () => {
      const email = 'john.doe@example.com';
      const filteredProfiles = [mockPartialProfile];
      mockProfilesService.findAll.mockResolvedValue(filteredProfiles);

      const result = await controller.findAll(email);

      expect(mockProfilesService.findAll).toHaveBeenCalledWith(email);
      expect(result).toEqual(filteredProfiles);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no profiles match email filter', async () => {
      const email = 'nonexistent@example.com';
      mockProfilesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(email);

      expect(mockProfilesService.findAll).toHaveBeenCalledWith(email);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a profile by id', async () => {
      mockProfilesService.findOne.mockResolvedValue(mockProfile);

      const result = await controller.findOne(1);

      expect(mockProfilesService.findOne).toHaveBeenCalledWith(1);
      expect(mockProfilesService.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProfile);
    });

    it('should handle number id properly', async () => {
      mockProfilesService.findOne.mockResolvedValue(mockProfile);

      const result = await controller.findOne(123);

      expect(mockProfilesService.findOne).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockProfilesService.findOne.mockRejectedValue(
        new NotFoundException('Profile with id 999 not found'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockProfilesService.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update a profile successfully', async () => {
      const updatedProfile = {
        ...mockPartialProfile,
        firstName: 'Jane',
        lastName: 'Smith',
      };
      mockProfilesService.update.mockResolvedValue(updatedProfile);

      const result = await controller.update(1, mockUpdateProfileDto);

      expect(mockProfilesService.update).toHaveBeenCalledWith(
        1,
        mockUpdateProfileDto,
      );
      expect(mockProfilesService.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedProfile);
    });

    it('should handle password update (password should be hashed)', async () => {
      const updateWithPassword = {
        ...mockUpdateProfileDto,
        password: 'newPassword123',
      };
      const updatedProfile = {
        ...mockPartialProfile,
        firstName: 'Jane',
        lastName: 'Smith',
      };
      mockProfilesService.update.mockResolvedValue(updatedProfile);

      const result = await controller.update(1, updateWithPassword);

      expect(mockProfilesService.update).toHaveBeenCalledWith(
        1,
        updateWithPassword,
      );
      expect(result).toEqual(updatedProfile);
      expect(result).not.toHaveProperty('password');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { firstName: 'UpdatedName' };
      const updatedProfile = {
        ...mockPartialProfile,
        firstName: 'UpdatedName',
      };
      mockProfilesService.update.mockResolvedValue(updatedProfile);

      const result = await controller.update(1, partialUpdate);

      expect(mockProfilesService.update).toHaveBeenCalledWith(1, partialUpdate);
      if (typeof result === 'object' && result !== null) {
        expect(result.firstName).toBe('UpdatedName');
      }
    });
  });

  describe('remove', () => {
    it('should remove a profile successfully', async () => {
      const successMessage = 'Profile with id 1 has been removed';
      mockProfilesService.remove.mockResolvedValue(successMessage);

      const result = await controller.remove(1);

      expect(mockProfilesService.remove).toHaveBeenCalledWith(1);
      expect(mockProfilesService.remove).toHaveBeenCalledTimes(1);
      expect(result).toBe(successMessage);
    });

    it('should handle removal of non-existent profile', async () => {
      const notFoundMessage = 'No profile found with id 999';
      mockProfilesService.remove.mockResolvedValue(notFoundMessage);

      const result = await controller.remove(999);

      expect(mockProfilesService.remove).toHaveBeenCalledWith(999);
      expect(result).toBe(notFoundMessage);
    });
  });

  // ===============================
  // FAILING TESTS (Demonstrating Common Testing Mistakes)
  // ===============================

  //   describe('create - Failing Tests (Wrong Expectations)', () => {
  //     it('FAIL: should expect wrong return value', async () => {
  //       mockProfilesService.create.mockResolvedValue(mockPartialProfile);

  //       const result = await controller.create(mockCreateProfileDto);

  //       // Wrong expectation - expecting different data
  //       expect(result.firstName).toBe('Jane'); // Should be 'John'
  //     });

  //     it('FAIL: should expect password in response (security violation)', async () => {
  //       mockProfilesService.create.mockResolvedValue(mockPartialProfile);

  //       const result = await controller.create(mockCreateProfileDto);

  //       // Wrong expectation - password should not be in response
  //       expect(result).toHaveProperty('password');
  //     });

  //     it('FAIL: should expect wrong service call parameters', async () => {
  //       mockProfilesService.create.mockResolvedValue(mockPartialProfile);

  //       await controller.create(mockCreateProfileDto);

  //       // Wrong expectation - expecting different parameters
  //       expect(mockProfilesService.create).toHaveBeenCalledWith({
  //         ...mockCreateProfileDto,
  //         email: 'wrong@email.com',
  //       });
  //     });
  //   });

  //   describe('findAll - Failing Tests (Mock Issues)', () => {
  //     it('FAIL: should not setup mock properly', async () => {
  //       // Not setting up mock - will return undefined

  //       const result = await controller.findAll();

  //       expect(result).toEqual([mockPartialProfile]); // Will fail because mock returns undefined
  //     });

  //     it('FAIL: should expect wrong array length', async () => {
  //       mockProfilesService.findAll.mockResolvedValue([mockPartialProfile]);

  //       const result = await controller.findAll();

  //       expect(result).toHaveLength(5); // Should be 1
  //     });
  //   });

  //   describe('findOne - Failing Tests (Type and Parameter Issues)', () => {
  //     it('FAIL: should not convert string to number properly', async () => {
  //       mockProfilesService.findOne.mockResolvedValue(mockProfile);

  //       await controller.findOne(1);

  //       // Wrong expectation - passing string instead of number
  //       expect(mockProfilesService.findOne).toHaveBeenCalledWith('1');
  //     });

  //     it('FAIL: should expect wrong profile data', async () => {
  //       mockProfilesService.findOne.mockResolvedValue(mockProfile);

  //       const result = await controller.findOne(1);

  //       // Wrong expectation - expecting different email
  //       expect(result.email).toBe('wrong@email.com');
  //     });
  //   });

  //   describe('update - Failing Tests (Mock Verification Issues)', () => {
  //     it('FAIL: should not verify service call count', async () => {
  //       mockProfilesService.update.mockResolvedValue(mockPartialProfile);

  //       await controller.update(1, mockUpdateProfileDto);

  //       // Wrong expectation - expecting wrong call count
  //       expect(mockProfilesService.update).toHaveBeenCalledTimes(3); // Should be 1
  //     });

  //     it('FAIL: should expect service not to be called', async () => {
  //       mockProfilesService.update.mockResolvedValue(mockPartialProfile);

  //       await controller.update(1, mockUpdateProfileDto);

  //       // Wrong expectation - service should be called
  //       expect(mockProfilesService.update).not.toHaveBeenCalled();
  //     });
  //   });

  //   describe('remove - Failing Tests (Async/Promise Handling)', () => {
  //     it('FAIL: should not handle promises correctly', () => {
  //       mockProfilesService.remove.mockResolvedValue('Profile removed');

  //       // Missing await - will fail
  //       const result = controller.remove(1);

  //       expect(result).toBe('Profile removed'); // Will fail because result is a Promise
  //     });

  //     it('FAIL: should expect wrong return type', async () => {
  //       mockProfilesService.remove.mockResolvedValue(
  //         'Profile with id 1 has been removed',
  //       );

  //       const result = await controller.remove(1);

  //       // Wrong expectation - expecting object instead of string
  //       expect(typeof result).toBe('object');
  //     });
  //   });

  //   describe('Security and Validation - Failing Tests', () => {
  //     it('FAIL: should not validate email format properly', async () => {
  //       const invalidEmailDto = {
  //         ...mockCreateProfileDto,
  //         email: 'invalid-email',
  //       };
  //       mockProfilesService.create.mockResolvedValue(mockPartialProfile);

  //       const result = await controller.create(invalidEmailDto);

  //       // Should validate email format but test expects invalid email to work
  //       expect(result.email).toBe('invalid-email');
  //     });

  //     it('FAIL: should allow duplicate emails', async () => {
  //       mockProfilesService.create.mockRejectedValue(
  //         new Error('Profile with email john.doe@example.com already exists'),
  //       );

  //       // Should throw error for duplicate email, but test expects success
  //       const result = await controller.create(mockCreateProfileDto);

  //       expect(result).toEqual(mockPartialProfile);
  //     });

  //     it('FAIL: should not protect against empty required fields', async () => {
  //       const emptyFieldsDto = {
  //         ...mockCreateProfileDto,
  //         firstName: '',
  //         lastName: '',
  //         email: '',
  //       };
  //       mockProfilesService.create.mockResolvedValue(mockPartialProfile);

  //       const result = await controller.create(emptyFieldsDto);

  //       // Should validate required fields but test expects empty fields to work
  //       expect(result.firstName).toBe('');
  //     });
  //   });

  //   describe('Role-based Testing - Failing Tests', () => {
  //     it('FAIL: should not handle invalid role values', async () => {
  //       const invalidRoleDto = {
  //         ...mockCreateProfileDto,
  //         role: 'INVALID_ROLE' as Role,
  //       };
  //       mockProfilesService.create.mockResolvedValue(mockPartialProfile);

  //       const result = await controller.create(invalidRoleDto);

  //       // Should validate role enum but test expects invalid role to work
  //       expect(result.role).toBe('INVALID_ROLE');
  //     });

  //     it('FAIL: should not default to GUEST role when role is undefined', async () => {
  //       // Use type assertion to bypass TypeScript checking for this intentionally failing test
  //       const noRoleDto = { ...mockCreateProfileDto, role: Role.GUEST }; // Test with valid role first
  //       const profileWithoutRole = { ...mockPartialProfile, role: Role.GUEST };
  //       mockProfilesService.create.mockResolvedValue(profileWithoutRole);

  //       const result = await controller.create(noRoleDto);

  //       // This test is designed to fail - expecting undefined when we get GUEST
  //       expect(result.role).toBeUndefined();
  //     });
  //   });

  // ===============================
  // EDGE CASES AND ERROR HANDLING
  // ===============================

  describe('Edge Cases - Error Handling', () => {
    it('should handle service throwing generic errors', async () => {
      mockProfilesService.create.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.create(mockCreateProfileDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle very large ID values', async () => {
      const largeId = 999999999999999;
      mockProfilesService.findOne.mockResolvedValue(mockProfile);

      await controller.findOne(largeId);

      expect(mockProfilesService.findOne).toHaveBeenCalledWith(999999999999999);
    });

    it('should handle special characters in email during search', async () => {
      const specialEmail = 'test+user@domain.co.uk';
      mockProfilesService.findAll.mockResolvedValue([mockPartialProfile]);

      const result = await controller.findAll(specialEmail);

      expect(mockProfilesService.findAll).toHaveBeenCalledWith(specialEmail);
      expect(result).toEqual([mockPartialProfile]);
    });
  });
});
