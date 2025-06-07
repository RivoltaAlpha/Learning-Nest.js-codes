# School Management System - JWT Authentication with Role-Based Access Control (RBAC)

Please check the: [API Design](./API%20Design.md)

# Authorization

## Role Based Access Control Architecture

The RBAC system follows a clean architecture pattern:

```
User Request → AtGuard (Authentication) → RolesGuard (Authorization) → Controller
                     ↓                           ↓
               JWT Validation              Database Role Check
```

This approach ensures that:

- Authentication is handled globally and consistently
- Authorization is granular and role-specific
- Controllers focus on business logic rather than security concerns
- Security policies can be easily maintained and updated

By combining JWT authentication with role-based authorization, this system provides enterprise-grade security while maintaining developer productivity and code maintainability.

# Step-by-Step RBAC Implementation Guide

This guide walks you through implementing Role-Based Access Control (RBAC) in a NestJS application using the exact code from this codebase.

## Step 1: Define User Roles

Create an enum to define the different user roles in your system.

**File:** `src/profiles/entities/profile.entity.ts`

```typescript
export enum Role {
  STUDENT = 'student',
  FACULTY = 'faculty',
  ADMIN = 'admin',
  GUEST = 'guest',
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.GUEST })
  role: Role;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true, default: null })
  hashedRefreshToken: string | null;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToOne(() => Student, (student) => student.profile)
  student: Relation<Student>;

  @OneToOne(() => Lecturer, (lecturer) => lecturer.profile)
  lecturer: Relation<Lecturer>;
}
```

## Step 2: Create Role Decorator

Create a decorator to mark endpoints with required roles.

**File:** `src/auth/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../profiles/entities/profile.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

## Step 3: Create Public Decorator

Create a decorator to mark endpoints as public (no authentication required).

**File:** `src/auth/decorators/public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);
```

## Step 4: Update JWT Payload Interface

Update the JWT payload to include role information.

**File:** `src/auth/strategies/at.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

export type JWTPayload = {
  sub: number;
  email: string;
  role: string;
};

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt-at') {
  constructor(private readonly configServices: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configServices.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  validate(payload: JWTPayload) {
    return payload; // Return the payload directly, which contains user information
  }
}
```

## Step 5: Update Auth Service to Include Roles

Modify the authentication service to include role information in JWT tokens.

**File:** `src/auth/auth.service.ts`

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Profile) private profileRepository: Repository<Profile>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Helper method to generates access and refresh tokens for the user
  private async getTokens(userId: number, email: string, role: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
          role: role,
        },
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_SECRET',
          ),
          expiresIn: this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
          ), // 15 minutes
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
          role: role,
        },
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_SECRET',
          ),
          expiresIn: this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
          ), // 60, "2 days", "10h", "7d"
        },
      ),
    ]);
    return { accessToken: at, refreshToken: rt };
  }

  // Method to sign in the user
  async signIn(createAuthDto: CreateAuthDto) {
    // check if the user exists in the database
    const foundUser = await this.profileRepository.findOne({
      where: { email: createAuthDto.email },
      select: ['id', 'email', 'password', 'role'], // Include role in selection
    });
    if (!foundUser) {
      throw new NotFoundException(
        `User with email ${createAuthDto.email} not found`,
      );
    }
    // compare hashed password with the password provided
    const foundPassword = await Bcrypt.compare(
      createAuthDto.password,
      foundUser.password,
    );
    if (!foundPassword) {
      throw new NotFoundException('Invalid credentials');
    }
    // if correct generate tokens
    const { accessToken, refreshToken } = await this.getTokens(
      foundUser.id,
      foundUser.email,
      foundUser.role,
    );

    // save refresh token in the database
    await this.saveRefreshToken(foundUser.id, refreshToken);
    // return the tokens
    return { accessToken, refreshToken };
  }

  // Method to refresh tokens
  async refreshTokens(id: number, refreshToken: string) {
    // get user
    const foundUser = await this.profileRepository.findOne({
      where: { id: id },
      select: ['id', 'email', 'role', 'hashedRefreshToken'], // Include role in selection
    });

    if (!foundUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!foundUser.hashedRefreshToken) {
      throw new NotFoundException('No refresh token found');
    }

    // check if the refresh token is valid
    const refreshTokenMatches = await Bcrypt.compare(
      refreshToken,
      foundUser.hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      throw new NotFoundException('Invalid refresh token');
    }
    // generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await this.getTokens(
      foundUser.id,
      foundUser.email,
      foundUser.role,
    );
    // save new refresh token in the database
    await this.saveRefreshToken(foundUser.id, newRefreshToken);
    // return the new tokens
    return { accessToken, refreshToken: newRefreshToken };
  }
}
```

## Step 6: Create Access Token Guard

Create a guard that handles both authentication and public routes.

**File:** `src/auth/guards/at.guard.ts`

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class AtGuard extends AuthGuard('jwt-at') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

## Step 7: Create Roles Guard

Create a guard that validates user permissions based on their role.

**File:** `src/auth/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../profiles/entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { JWTPayload } from '../strategies/at.strategy';

interface UserRequest extends Request {
  user?: JWTPayload; // Extend Request to include user property
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }
    const request = context.switchToHttp().getRequest<UserRequest>();
    const user = request.user;

    if (!user) {
      return false; // No user in request
    }

    // Fetch the user's profile to get their role
    const userProfile = await this.profileRepository.findOne({
      where: { id: user.sub },
      select: ['id', 'role'],
    });

    if (!userProfile) {
      return false; // User profile not found
    }

    // Check if user's role is in the required roles
    return requiredRoles.some((role) => userProfile.role === role);
  }
}
```

## Step 8: Create Index Files for Guards and Decorators

**File:** `src/auth/guards/index.ts`

```typescript
export * from './at.guard';
export * from './rt.guard';
export * from './roles.guard';
```

**File:** `src/auth/decorators/index.ts`

```typescript
export * from './get-current-user-id.decorator';
export * from './get-current-user.decorator';
export * from './public.decorator';
export * from './roles.decorator';
```

## Step 9: Apply Guards to Controllers

Apply both authentication and authorization guards to your controllers.

**Example:** `src/profiles/profiles.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto';
import { Public, Roles } from 'src/auth/decorators';
import { AtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from './entities/profile.entity';

@Controller('profiles')
@UseGuards(AtGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Public()
  @Post()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }

  @Roles(Role.ADMIN, Role.FACULTY)
  @Get()
  findAll(@Query('email') email?: string) {
    return this.profilesService.findAll(email);
  }

  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.remove(id);
  }
}
```

## Step 10: Configure Module Dependencies

Ensure all modules that use RBAC import the required dependencies.

**Example:** `src/profiles/profile.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Profile])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfileModule {}
```

## Step 11: Configure Global Auth Module

Configure the auth module to provide guards globally.

**File:** `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/profiles/entities/profile.entity';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy, RfStrategy } from './strategies';
import { RolesGuard } from './guards';

@Module({
  imports: [TypeOrmModule.forFeature([Profile]), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AtStrategy, RfStrategy, RolesGuard],
  exports: [RolesGuard],
})
export class AuthModule {}
```

## Step 12: Testing Your RBAC Implementation

### Create Test Users

```http
### Create Admin User
POST http://localhost:8000/profiles
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@school.com",
  "password": "admin123",
  "role": "admin"
}

### Create Faculty User
POST http://localhost:8000/profiles
Content-Type: application/json

{
  "firstName": "Faculty",
  "lastName": "User",
  "email": "faculty@school.com",
  "password": "faculty123",
  "role": "faculty"
}

### Create Student User
POST http://localhost:8000/profiles
Content-Type: application/json

{
  "firstName": "Student",
  "lastName": "User",
  "email": "student@school.com",
  "password": "student123",
  "role": "student"
}
```

### Get Authentication Tokens

```http
### Get Admin Token
POST http://localhost:8000/auth/signin
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "admin123"
}

### Get Faculty Token
POST http://localhost:8000/auth/signin
Content-Type: application/json

{
  "email": "faculty@school.com",
  "password": "faculty123"
}

### Get Student Token
POST http://localhost:8000/auth/signin
Content-Type: application/json

{
  "email": "student@school.com",
  "password": "student123"
}
```

### Test Role-Based Access

```http
### Admin can view all profiles (should succeed)
GET http://localhost:8000/profiles
Authorization: Bearer {{admin_token}}

### Faculty can view all profiles (should succeed)
GET http://localhost:8000/profiles
Authorization: Bearer {{faculty_token}}

### Student cannot view all profiles (should return 403)
GET http://localhost:8000/profiles
Authorization: Bearer {{student_token}}

### Only Admin can delete profiles (should succeed)
DELETE http://localhost:8000/profiles/1
Authorization: Bearer {{admin_token}}

### Faculty cannot delete profiles (should return 403)
DELETE http://localhost:8000/profiles/1
Authorization: Bearer {{faculty_token}}
```

## Key Implementation Notes

1. **Guard Order Matters**: Always apply `AtGuard` before `RolesGuard` as authentication must happen before authorization.

2. **Public Routes**: Use `@Public()` decorator for endpoints that don't require authentication.

3. **Role Checking**: The `RolesGuard` queries the database to get the user's current role, ensuring real-time role validation.

4. **JWT Payload**: Include role information in JWT tokens but always verify against the database for security.

5. **Error Handling**: The guards return `false` for unauthorized access, which NestJS automatically converts to a 403 Forbidden response.

This implementation provides a robust, secure, and maintainable RBAC system that can be easily extended with additional roles and permissions.

## RBAC Implementation Details

### 1. Roles Decorator

The `@Roles()` decorator is used to specify which roles are required to access an endpoint:

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../profiles/entities/profile.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

**Usage:**

```typescript
@Roles(Role.ADMIN, Role.FACULTY)
@Get()
findAll() {
  // Only ADMIN and FACULTY can access this endpoint
}
```

### 2. Roles Guard

The `RolesGuard` validates user permissions by checking their role against required roles:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../profiles/entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { JWTPayload } from '../strategies/at.strategy';

interface UserRequest extends Request {
  user?: JWTPayload; // Extend Request to include user property
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }
    const request = context.switchToHttp().getRequest<UserRequest>();
    const user = request.user;

    if (!user) {
      return false; // No user in request
    }

    // Fetch the user's profile to get their role
    const userProfile = await this.profileRepository.findOne({
      where: { id: user.sub },
      select: ['id', 'role'],
    });

    if (!userProfile) {
      return false; // User profile not found
    }

    // Check if user's role is in the required roles
    return requiredRoles.some((role) => userProfile.role === role);
  }
}

```

### 3. JWT Token Enhancement

JWT tokens now include user role information:

```typescript
// JWT Payload structure
interface JWTPayload {
  sub: string;  // User ID
  email: string;
  role: Role;   // User Role
}

// Token generation with role
private async getTokens(userId: string, email: string, role: Role) {
  const payload = { sub: userId, email, role };
  
  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    }),
    this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    }),
  ]);

  return { accessToken, refreshToken };
}
```

### 4. Controller-Level Authorization

Each controller now implements role-based restrictions:

#### Profiles Controller

```typescript
@Controller('profiles')
@UseGuards(AtGuard, RolesGuard)
export class ProfilesController {
  @Public()
  @Post()  // Anyone can create a profile
  create(@Body() createProfileDto: CreateProfileDto) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Get()  // Only ADMIN and FACULTY can view all profiles
  findAll(@Query('email') email?: string) {}

  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Get(':id')  // Users can view individual profiles
  findOne(@Param('id', ParseIntPipe) id: number) {}

  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Patch(':id')  // Users can update profiles (with ownership validation)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProfileDto: UpdateProfileDto) {}

  @Roles(Role.ADMIN)
  @Delete(':id')  // Only ADMIN can delete profiles
  remove(@Param('id', ParseIntPipe) id: number) {}
}
```

#### Students Controller

```typescript
@Controller('students')
@UseGuards(AtGuard, RolesGuard)
export class StudentsController {
  @Roles(Role.ADMIN, Role.FACULTY)
  @Post()  // Only ADMIN and FACULTY can create students
  create(@Body() createStudentDto: CreateStudentDto) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Get()  // Only ADMIN and FACULTY can view all students
  findAll(@Query('name') name?: string) {}

  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Get(':id')  // Users can view individual student records
  findOne(@Param('id', ParseIntPipe) id: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Patch(':id')  // Only ADMIN and FACULTY can update students
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStudentDto: UpdateStudentDto) {}

  @Roles(Role.ADMIN)
  @Delete(':id')  // Only ADMIN can delete students
  remove(@Param('id', ParseIntPipe) id: number) {}

  // Course enrollment endpoints
  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Get(':id/courses')  // Get student's courses
  getStudentCourses(@Param('id', ParseIntPipe) id: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Post(':studentId/courses/:courseId')  // Enroll student in course
  enrollStudentInCourse(@Param('studentId', ParseIntPipe) studentId: number, @Param('courseId', ParseIntPipe) courseId: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Delete(':studentId/courses/:courseId')  // Unenroll student from course
  unenrollStudentFromCourse(@Param('studentId', ParseIntPipe) studentId: number, @Param('courseId', ParseIntPipe) courseId: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Patch(':id/courses')  // Update student's courses (batch)
  updateStudentCourses(@Param('id', ParseIntPipe) id: number, @Body() courseIds: number[]) {}
}
```

#### Courses Controller

```typescript
@Controller('courses')
@UseGuards(AtGuard, RolesGuard)
export class CoursesController {
  @Roles(Role.ADMIN, Role.FACULTY)
  @Post()  // Only ADMIN and FACULTY can create courses
  create(@Body() createCourseDto: CreateCourseDto) {}

  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Get()  // All authenticated users can view courses
  findAll(@Query('search') search?: string) {}

  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Get(':id')  // All authenticated users can view individual courses
  findOne(@Param('id', ParseIntPipe) id: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Patch(':id')  // Only ADMIN and FACULTY can update courses
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCourseDto: UpdateCourseDto) {}

  @Roles(Role.ADMIN)
  @Delete(':id')  // Only ADMIN can delete courses
  remove(@Param('id', ParseIntPipe) id: number) {}

  // Course enrollment management (ADMIN only)
  @Roles(Role.ADMIN)
  @Get(':id/students')  // Get enrolled students
  getEnrolledStudents(@Param('id', ParseIntPipe) id: number) {}

  @Roles(Role.ADMIN)
  @Post(':courseId/students/:studentId')  // Add student to course
  addStudentToCourse(@Param('courseId', ParseIntPipe) courseId: number, @Param('studentId', ParseIntPipe) studentId: number) {}
  @Roles(Role.ADMIN)
  @Delete(':courseId/students/:studentId')  // Remove student from course
  removeStudentFromCourse(@Param('courseId', ParseIntPipe) courseId: number, @Param('studentId', ParseIntPipe) studentId: number) {}
}
```

#### Departments Controller

```typescript
@Controller('departments')
@UseGuards(AtGuard, RolesGuard)
export class DepartmentsController {
  @Roles(Role.ADMIN, Role.FACULTY)
  @Post()  // Only ADMIN and FACULTY can create departments
  create(@Body() createDepartmentDto: CreateDepartmentDto) {}

  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Get()  // All authenticated users can view departments
  findAll(@Query('search') search?: string) {}

  @Roles(Role.ADMIN, Role.FACULTY, Role.STUDENT)
  @Get(':id')  // All authenticated users can view individual departments
  findOne(@Param('id', ParseIntPipe) id: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Patch(':id')  // Only ADMIN and FACULTY can update departments
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDepartmentDto: UpdateDepartmentDto) {}

  @Roles(Role.ADMIN)
  @Delete(':id')  // Only ADMIN can delete departments
  remove(@Param('id', ParseIntPipe) id: number) {}
}
```

#### Lecturer Controller

```typescript
@Controller('lecturer')
@UseGuards(AtGuard, RolesGuard)
export class LecturerController {
  @Public()
  @Post()  // Anyone can create a lecturer profile
  create(@Body() createLecturerDto: CreateLecturerDto) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Get()  // Only ADMIN and FACULTY can view all lecturers
  findAll(@Query('name') name?: string) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Get(':id')  // Only ADMIN and FACULTY can view individual lecturers
  findOne(@Param('id', ParseIntPipe) id: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Patch(':id')  // Only ADMIN and FACULTY can update lecturers
  update(@Param('id', ParseIntPipe) id: number, @Body() updateLecturerDto: UpdateLecturerDto) {}

  @Roles(Role.ADMIN)
  @Delete(':id')  // Only ADMIN can delete lecturers
  remove(@Param('id', ParseIntPipe) id: number) {}

  // Lecturer-Course assignment endpoints
  @Roles(Role.ADMIN, Role.FACULTY)
  @Get(':id/courses')  // Get lecturer's courses
  getLecturerCourses(@Param('id', ParseIntPipe) id: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Post(':lecturerId/courses/:courseId')  // Assign lecturer to course
  assignLecturerToCourse(@Param('lecturerId', ParseIntPipe) lecturerId: number, @Param('courseId', ParseIntPipe) courseId: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Delete(':lecturerId/courses/:courseId')  // Unassign lecturer from course
  unassignLecturerFromCourse(@Param('lecturerId', ParseIntPipe) lecturerId: number, @Param('courseId', ParseIntPipe) courseId: number) {}

  @Roles(Role.ADMIN, Role.FACULTY)
  @Patch(':id/courses')  // Update lecturer's courses (batch)
  updateLecturerCourses(@Param('id', ParseIntPipe) id: number, @Body() courseIds: number[]) {}
}
```

#### Auth Controller

```typescript
@Controller('auth')
export class AuthController {
  @Public()
  @Post('signin')  // Public signin endpoint
  signInLocal(@Body() createAuthDto: CreateAuthDto) {}

  @UseGuards(AtGuard)
  @Get('signout/:id')  // Protected signout endpoint
  signOut(@Param('id') id: string) {}

  @Public()
  @UseGuards(RtGuard)
  @Get('refresh')  // Public refresh endpoint with refresh token guard
  refreshTokens(@Query('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {}
}
```

### 5. Module Configuration

Each module that uses RBAC must import the required dependencies:

```typescript
@Module({
  imports: [
    DatabaseModule, 
    TypeOrmModule.forFeature([Course, Department, Student, Profile])
  ],
  providers: [CoursesService, RolesGuard],
  controllers: [CoursesController],
})
export class CoursesModule {}
```

## RBAC Usage Guide

### Setting Up RBAC in Controllers

1. **Import Required Dependencies:**

```typescript
import { UseGuards } from '@nestjs/common';
import { Roles, Public } from 'src/auth/decorators';
import { AtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/profiles/entities/profile.entity';
```

2. **Apply Guards at Controller Level:**

```typescript
@Controller('your-resource')
@UseGuards(AtGuard, RolesGuard)
export class YourController {
  // Your methods here
}
```

3. **Specify Role Requirements:**

```typescript
// Single role
@Roles(Role.ADMIN)
@Delete(':id')
deleteResource() {}

// Multiple roles
@Roles(Role.ADMIN, Role.FACULTY)
@Get()
findAll() {}

// Public access (no roles required)
@Public()
@Get('public-info')
getPublicInfo() {}
```

### Authorization Patterns

#### Create Operations

- **Public:** Profile and lecturer registration endpoints (`@Public()`)
- **ADMIN/FACULTY:** Creating students, courses, and departments
- **No Creation Rights:** Students cannot create institutional resources

#### Read Operations

- **Public:** None (all read operations require authentication)
- **All Authenticated (ADMIN/FACULTY/STUDENT):**
  - Individual profiles, students, courses, and departments
  - Student's own courses
  - Lecturer's courses
- **ADMIN/FACULTY Only:**
  - Listing all profiles, students, and lecturers
  - Course enrollment management
- **ADMIN Only:**
  - Enrolled students per course
  - Course-student relationship management

#### Update Operations

- **ADMIN/FACULTY:**
  - Institutional resource management (students, courses, departments, lecturers)
  - Student course enrollments
  - Lecturer course assignments
- **All Authenticated (ADMIN/FACULTY/STUDENT):**
  - Own profile updates (with ownership validation)

#### Delete Operations

- **ADMIN Only:**
  - All entity deletions (profiles, students, courses, departments, lecturers)
  - Course enrollment removals
  - For data integrity and audit compliance
- **No Delete Rights:** Faculty and Students cannot delete any resources

## Error Handling

The RBAC system provides clear error responses:

```json
// Insufficient permissions
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}

// Authentication required
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## RBAC Testing Guide

## Overview

This guide provides step-by-step instructions for testing the Role-Based Access Control (RBAC) implementation in the School Management System.

## Prerequisites

1. Application running on `http://localhost:8000`
2. Database properly configured and seeded
3. REST client (Postman, Insomnia, or VSCode REST Client)

## Testing Steps

### 1. Create Test Users

#### Create Admin User

```http
POST http://localhost:8000/auth/signup
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "admin123"
}
```

#### Create Faculty User

```http
POST http://localhost:8000/auth/signup
Content-Type: application/json

{
  "email": "faculty@school.com",
  "password": "faculty123"
}
```

#### Create Student User

```http
POST http://localhost:8000/auth/signup
Content-Type: application/json

{
  "email": "student@school.com",
  "password": "student123"
}
```

### 2. Update User Roles in Database

```sql
-- Update roles directly in database
UPDATE profile SET role = 'ADMIN' WHERE email = 'admin@school.com';
UPDATE profile SET role = 'FACULTY' WHERE email = 'faculty@school.com';
UPDATE profile SET role = 'STUDENT' WHERE email = 'student@school.com';
```

### 3. Get Authentication Tokens

#### Get Admin Token

```http
POST http://localhost:8000/auth/signin
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "admin123"
}
```

#### Get Faculty Token

```http
POST http://localhost:8000/auth/signin
Content-Type: application/json

{
  "email": "faculty@school.com",
  "password": "faculty123"
}
```

#### Get Student Token

```http
POST http://localhost:8000/auth/signin
Content-Type: application/json

{
  "email": "student@school.com",
  "password": "student123"
}
```

## Test Cases

### 4. Test Profile Access

#### ✅ Admin can view all profiles

```http
GET http://localhost:8000/profiles
Authorization: Bearer {admin_token}
```

#### ✅ Faculty can view all profiles

```http
GET http://localhost:8000/profiles
Authorization: Bearer {faculty_token}
```

#### ❌ Student cannot view all profiles (should return 403)

```http
GET http://localhost:8000/profiles
Authorization: Bearer {student_token}
```

#### ✅ All roles can view individual profile

```http
GET http://localhost:8000/profiles/1
Authorization: Bearer {any_token}
```

#### ❌ Only Admin can delete profiles (others should return 403)

```http
DELETE http://localhost:8000/profiles/1
Authorization: Bearer {faculty_or_student_token}
```

### 5. Test Student Management

#### ✅ Admin can create students

```http
POST http://localhost:8000/students
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "profileId": 1,
  "studentId": "STU001",
  "year": 1
}
```

#### ✅ Faculty can create students

```http
POST http://localhost:8000/students
Authorization: Bearer {faculty_token}
Content-Type: application/json

{
  "profileId": 2,
  "studentId": "STU002",
  "year": 2
}
```

#### ❌ Student cannot create students (should return 403)

```http
POST http://localhost:8000/students
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "profileId": 3,
  "studentId": "STU003",
  "year": 1
}
```

### 6. Test Course Management

#### ✅ Admin can create courses

```http
POST http://localhost:8000/courses
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Advanced Mathematics",
  "code": "MATH301",
  "credits": 3,
  "departmentId": 1
}
```

#### ✅ Faculty can create courses

```http
POST http://localhost:8000/courses
Authorization: Bearer {faculty_token}
Content-Type: application/json

{
  "name": "Computer Science Basics",
  "code": "CS101",
  "credits": 4,
  "departmentId": 1
}
```

#### ❌ Student cannot create courses (should return 403)

```http
POST http://localhost:8000/courses
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "name": "Test Course",
  "code": "TEST101",
  "credits": 2,
  "departmentId": 1
}
```

#### ✅ All roles can view courses

```http
GET http://localhost:8000/courses
Authorization: Bearer {any_token}
```

### 7. Test Department Management

#### ✅ Admin can create departments

```http
POST http://localhost:8000/departments
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Computer Science",
  "code": "CS"
}
```

#### ✅ Faculty can create departments

```http
POST http://localhost:8000/departments
Authorization: Bearer {faculty_token}
Content-Type: application/json

{
  "name": "Mathematics",
  "code": "MATH"
}
```

#### ❌ Student cannot create departments (should return 403)

```http
POST http://localhost:8000/departments
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "name": "Test Department",
  "code": "TEST"
}
```

## Expected Results Summary

| Action                  | ADMIN | FACULTY | STUDENT | Expected Result |
| ----------------------- | ----- | ------- | ------- | --------------- |
| View all profiles       | ✅    | ✅      | ❌      | 200/200/403     |
| View individual profile | ✅    | ✅      | ✅      | 200/200/200     |
| Delete profile          | ✅    | ❌      | ❌      | 200/403/403     |
| Create student          | ✅    | ✅      | ❌      | 201/201/403     |
| View all students       | ✅    | ✅      | ❌      | 200/200/403     |
| Create course           | ✅    | ✅      | ❌      | 201/201/403     |
| View courses            | ✅    | ✅      | ✅      | 200/200/200     |
| Create department       | ✅    | ✅      | ❌      | 201/201/403     |
| View departments        | ✅    | ✅      | ✅      | 200/200/200     |

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**: User doesn't have required role
2. **401 Unauthorized Error**: Invalid or expired token
3. **500 Internal Server Error**: Database connection issues or missing profile

### Debugging Steps

1. Verify user roles in database
2. Check JWT token validity
3. Ensure RolesGuard is properly imported in modules
4. Verify Profile entity is available in TypeORM

### Verification Commands

```sql
-- Check user roles
SELECT p.id, p.email, p.role FROM profile p;

-- Check if profiles exist
SELECT COUNT(*) FROM profile;
```

## Notes

- The `@Public()` decorator bypasses both authentication and authorization
- The `@Roles()` decorator requires authentication first (handled by AtGuard)
- Users can only be created via signup endpoint (which is public)
- Role assignment must be done directly in the database for this implementation
- Consider implementing an admin interface for role management in production

# Authentication

![1741550989476](image/Authentication/1741550989476.png)

![1741551029786](image/Authentication/1741551029786.png)

This NestJS application implements a comprehensive JWT-based authentication system with Role-Based Access Control (RBAC) using access and refresh tokens. The system provides secure user authentication, authorization based on user roles, and token management with automatic route protection and fine-grained access control.

## Key Features

- 🔐 **JWT-based Authentication** - Secure token-based authentication
- 🔄 **Dual Token System** - Separate access and refresh tokens
- 🛡️ **Global Route Protection** - All routes protected by default
- 👥 **Role-Based Access Control** - Fine-grained access control based on user roles
- 🎯 **Flexible Access Control** - Easy public route designation
- 🔧 **Custom Decorators** - Convenient user data extraction and role specification
- 📊 **TypeORM Integration** - Database-backed user management
- 🔒 **Password Hashing** - bcrypt for secure password storage

## Role-Based Access Control (RBAC)

### User Roles

The system supports four distinct user roles with different access levels:

- **ADMIN** - Full system access, can manage all resources
- **FACULTY** - Can manage courses, students, and view most resources
- **STUDENT** - Limited access, can view own data and course information
- **GUEST** - Minimal access for public information

### Role Hierarchy

```text
ADMIN (Highest)
├── Full access to all endpoints
├── Can create, read, update, delete all resources
└── Can manage users and their roles

FACULTY
├── Can manage courses and departments
├── Can view and manage student information
├── Can access most GET endpoints
└── Cannot delete critical resources

STUDENT
├── Can view own profile and course information
├── Can update own profile
├── Limited to read-only access for most resources
└── Cannot access administrative functions

GUEST (Lowest)
├── Access to public endpoints only
├── Can view general course/department information
└── Cannot access user-specific data
```

## Setting Up Authentication

### Installation

To set up authentication in NestJS, you'll need to install the following packages:

```bash
pnpm add @nestjs/passport passport passport-jwt
pnpm add @nestjs/jwt
pnpm add -D @types/passport-jwt
pnpm add bcrypt
```

For TypeScript typings:

```bash
pnpm add -D @types/passport-jwt @types/bcrypt
```

### Authentication Flow with RBAC in this Application

1. **User registers (signs up)** via `/auth/signup` endpoint

![1741551283527](image/Authentication/1741551283527.png)

2. **User logs in (signs in)** via `/auth/signin` endpoint and receives:

- Access token (short-lived, contains user role)
- Refresh token (long-lived, contains user role)

![1741551391995](image/Authentication/1741551391995.png)

3. **User includes the access token** in requests to protected resources via Bearer token

- Token is validated by AtGuard (authentication)
- User role is checked by RolesGuard (authorization)

![1741551559998](image/Authentication/1741551559998.png)

4. **When the access token expires**, user can get a new one via `/auth/refresh` endpoint using the refresh token

![1741551711126](image/Authentication/1741551711126.png)

![1741551779848](image/Authentication/1741551779848.png)

5. **User can sign out** via `/auth/signout/:id` endpoint to invalidate their tokens

![1741551854680](image/Authentication/1741551854680.png)

## NestJS Authentication and Authorization Components: Decorators, Strategies, and Guards Explained

### Decorators

Decorators in NestJS are special functions that modify the behavior of classes, methods, or parameters. In authentication and authorization:

#### `@Public()` Decorator

```typescript
@Public()
@Get('categories')
findAll() {
  // This endpoint is accessible without authentication
}
```

- **Purpose**: Marks specific routes as publicly accessible
- **How it works**: Sets metadata that tells guards to skip authentication checks

#### `@Roles()` Decorator

```typescript
@Roles(Role.ADMIN, Role.FACULTY)
@Get('students')
findAll() {
  // This endpoint is accessible only to ADMIN and FACULTY roles
}
```

- **Purpose**: Specifies which user roles can access specific routes
- **How it works**: Sets metadata containing required roles for the RolesGuard to check

### Strategies

Strategies define how authentication is performed - they implement different authentication methods.

#### Access Token Strategy

```typescript
// This validates regular API requests
@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt-at') {
  constructor(private readonly configService: ConfigService) {
   super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
   });
  }

  validate(payload: JWTPayload) {
   return payload; // This attaches the user data to request.user
  }
}
```

- **Purpose**: Validates short-lived access tokens
- **How it works**: Extracts the JWT from the Authorization header, verifies it with the secret key, and attaches the payload to the request

#### Refresh Token Strategy

```typescript
// This specifically validates refresh token requests
@Injectable()
export class RfStrategy extends PassportStrategy(Strategy, 'jwt-rt') {
  // Similar implementation, but for refresh tokens
}
```

- **Purpose**: Validates long-lived refresh tokens
- **How it works**: Similar to access token strategy but uses a different secret key

> Please remember to register both strategies in the `auth.module.ts` as providers
>
> `providers: [AuthService, AtStrategy, RfStrategy],`

### Guards

Guards are middleware that determine if a request can proceed to a route handler.

#### Access Token Guard

```typescript
@Injectable()
export class AtGuard extends AuthGuard('jwt-at') {
  // Implementation that checks if routes are public or protected
}
```

- **Purpose**: Protects routes from unauthorized access
- **How it works**: Intercepts requests and uses the access token strategy to validate before allowing the request to proceed
- Applied globally to all routes by default

#### Refresh Token Guard

```typescript
@Injectable()
export class RtGuard extends AuthGuard('jwt-rt') {
  // Implementation specifically for refresh token validation
}
```

- **Purpose**: Specifically protects the token refresh endpoint
- **How it works**: Uses the refresh token strategy to validate refresh tokens

#### Roles Guard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  // Implementation that checks user roles against required roles
}
```

- **Purpose**: Provides role-based authorization for endpoints
- **How it works**: Fetches user's role from database and compares with required roles specified in @Roles() decorator
- Applied at controller or method level for fine-grained access control

### How They Work Together

1. When a request comes in, the **AtGuard** intercepts it for authentication
2. The AtGuard uses an **AtStrategy** to validate the JWT token
3. If authentication is successful, user information is attached to the request
4. The **RolesGuard** then checks if the user has the required role(s) for authorization
5. If authorized, your controller methods can use **Decorators** to easily access user information

**Authentication Flow:**

- **AtGuard** → **AtStrategy** → User authenticated
- **RolesGuard** → Database lookup → User authorized
- **Controller** → **Decorators** → Access user data

This separation creates a clean, secure authentication and authorization system where you can:

- Control which routes require authentication (AtGuard + @Public())
- Control which roles can access specific routes (RolesGuard + @Roles())
- Easily access authenticated user information in controllers

## Implementation Details

### Auth Module Structure

The authentication system is organized as follows:

```
src/auth/
├── auth.controller.ts
├── auth.module.ts
├── auth.service.ts
├── decorators/
│   ├── get-current-user.decorator.ts
│   ├── get-current-user-id.decorator.ts
│   ├── index.ts
│   ├── public.decorator.ts
│   └── roles.decorator.ts
├── dto/
│   └── login.dto.ts
├── guards/
│   ├── at.guard.ts
│   ├── index.ts
│   ├── roles.guard.ts
│   └── rt.guard.ts
└── strategies/
    ├── at.startegy.ts
    ├── index.ts
    └── rt.strategy.ts
```

### Authentication Controller

The `AuthController` handles authentication operations:

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  signUpLocal(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signUpLocal(createAuthDto);
  }

  @Public()
  @Post('signin')
  signInLocal(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signInLocal(createAuthDto);
  }
  
  @UseGuards(AtGuard)
  @Get('signout/:id')
  signOut(@Param('id') id: string) {
    return this.authService.signOut(id);
  }

  @UseGuards(RtGuard)
  @Get('refresh')
  refreshTokens(
    @Query('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (user.sub !== id) {
      throw new UnauthorizedException('Invalid user');
    }
    return this.authService.refreshTokens(id, user.refreshToken);
  }
}
```

### Authentication Service

The `AuthService` handles authentication business logic:

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Sign up a new user
  async signUpLocal(createAuthDto: CreateAuthDto) {
    // Check if user exists
    // Hash password
    // Save user
    // Generate tokens
    // Return tokens
  }

  // Sign in an existing user
  async signInLocal(AuthData: CreateAuthDto) {
    // Check if user exists
    // Validate password
    // Generate tokens
    // Save refresh token
    // Return tokens
  }

  // Sign out a user
  async signOut(userId: string) {
    // Remove refresh token
    // Return success message
  }

  // Refresh tokens
  async refreshTokens(userId: string, refreshToken: string) {
    // Validate refresh token
    // Generate new tokens
    // Update refresh token
    // Return new tokens
  }

  // Generate access and refresh tokens
  private async getTokens(userId: string, email: string) {
    // Generate access token
    // Generate refresh token
    // Return tokens
  }
}
```

### JWT Strategies

Two JWT strategies are implemented:

1. **Access Token Strategy** (`at.strategy.ts`):

   ```typescript
   @Injectable()
   export class AtStrategy extends PassportStrategy(Strategy, 'jwt-at') {
     constructor(private readonly configService: ConfigService) {
       super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         secretOrKey: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
       });
     }

     validate(payload: JWTPayload) {
       return payload; // attaches payload to request.user
     }
   }
   ```
2. **Refresh Token Strategy** (`rt.strategy.ts`):

   ```typescript
   @Injectable()
   export class RfStrategy extends PassportStrategy(Strategy, 'jwt-rt') {
     constructor(private readonly configService: ConfigService) {
       super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         secretOrKey: configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
         passReqToCallback: true,
       });
     }

     validate(req: Request, payload: any) {
       const refreshToken = req.get('Authorization').replace('Bearer', '').trim();
       return { ...payload, refreshToken };
     }
   }
   ```

### Auth Guards

Two guards protect routes:

1. **Access Token Guard** (`at.guard.ts`):

   ```typescript
   @Injectable()
   export class AtGuard extends AuthGuard('jwt-at') {
     constructor(private reflector: Reflector) {
       super();
     }

     canActivate(context: ExecutionContext) {
       const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
         context.getHandler(),
         context.getClass(),
       ]);

       if (isPublic) {
         return true;
       }

       return super.canActivate(context);
     }
   }
   ```
2. **Refresh Token Guard** (`rt.guard.ts`):

   ```typescript
   @Injectable()
   export class RtGuard extends AuthGuard('jwt-rt') {
     constructor() {
       super();
     }
   }
   ```

### Custom Decorators

1. **Public Decorator** - Marks routes as public (no authentication required):

   ```typescript
   export const Public = () => SetMetadata('isPublic', true);
   ```

## Global Authentication

In this application, all routes are protected by default through the global application of the `AtGuard`:

```typescript
// In app.module.ts
@Module({
  // ...
  providers: [
    // ...
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    }
  ],
})
export class AppModule {}
```

## How to Use Authentication

### Protecting Routes

All routes are protected by default. To access them, include the access token in your request:

```http
GET http://localhost:8000/books
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Making Routes Public

To make a route public (no authentication required), use the `@Public()` decorator:

```typescript
import { Public } from '../auth/decorators';

@Controller('categories')
export class CategoriesController {
  // ...
  
  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }
  
  // ...
}
```

### Authentication Flow

1. **Register a new user**:

   ```http
   POST http://localhost:8000/auth/signup
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "securepassword123"
   }
   ```
2. **Sign in to get tokens**:

   ```http
   POST http://localhost:8000/auth/signin
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "securepassword123"
   }
   ```

   Response:

   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```
3. **Access protected resources**:

   ```http
   GET http://localhost:8000/books
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. **Refresh tokens when access token expires**:

   ```http
   GET http://localhost:8000/auth/refresh?id=user-id
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. **Sign out**:

   ```http
   GET http://localhost:8000/auth/signout/user-id
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Environment Configuration

The authentication system uses environment variables for configuration:

```
JWT_ACCESS_TOKEN_SECRET=your-access-token-secret
JWT_ACCESS_TOKEN_EXPIRATION_TIME=15m
JWT_REFRESH_TOKEN_SECRET=your-refresh-token-secret
JWT_REFRESH_TOKEN_EXPIRATION_TIME=7d
```

## Security Best Practices

1. **Separate token secrets**: Different secrets for access and refresh tokens.
2. **Short-lived access tokens**: Access tokens are short-lived (15 minutes by default).
3. **Longer-lived refresh tokens**: Refresh tokens last longer but can be invalidated.
4. **Password hashing**: Passwords are hashed using bcrypt before storage.
5. **Token invalidation**: Refresh tokens can be invalidated on sign-out.
6. **Public route marking**: Explicitly mark which routes should be public.
7. **Global protection**: All routes are protected by default.

## Conclusion

This NestJS application implements a comprehensive JWT-based authentication system with robust Role-Based Access Control (RBAC) using separate access and refresh tokens. The system provides multiple layers of security:

### Security Features

1. **Authentication Layer**: JWT tokens with separate secrets for access and refresh tokens
2. **Authorization Layer**: Role-based access control with fine-grained permissions
3. **Global Protection**: All routes protected by default with explicit public route marking
4. **Database Integration**: Real-time role validation against user profiles
5. **Token Management**: Secure token generation, validation, and invalidation

### Key Benefits

- **Scalable Authorization**: Easy to add new roles and modify permissions
- **Developer Experience**: Simple decorators for route protection and role specification
- **Security Best Practices**: Short-lived access tokens, role-based restrictions, password hashing
- **Flexible Access Control**: Support for public routes, role combinations, and hierarchical permissions
- **Audit Trail**: Clear separation between authentication and authorization for better logging
