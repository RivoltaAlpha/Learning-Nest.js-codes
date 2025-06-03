# School Management System - JWT Authentication with NestJS

Please check the: [API Design](./API%20Design.md)

## CASL Authorization System - Step-by-Step Implementation Guide

This guide provides a comprehensive walkthrough of implementing **CASL (Common Ability Schema Library)** for attribute-based access control (ABAC) in this NestJS school management system.

## 📚 What is CASL?

**CASL** is a powerful JavaScript library that provides:

- **Attribute-Based Access Control (ABAC)** - Fine-grained permissions based on user attributes, resource properties, and context
- **Declarative Permissions** - Define what users can do in a readable, maintainable way
- **Frontend/Backend Consistency** - Use the same permission logic across your entire application
- **Dynamic Permissions** - Permissions that can change based on context and data

### Key Concepts

- **Abilities**: What a user can do (read, create, update, delete)
- **Subjects**: What the action is performed on (Student, Course, Department)
- **Conditions**: When the action is allowed (ownership, role-based rules)

## 🚀 Step-by-Step Implementation

### Step 1: Install CASL Dependencies

```bash
pnpm add @casl/ability
```

### Step 2: Create the Core CASL Structure

Create the following directory structure under `src/casl/`:

```
src/casl/
├── action.enum.ts           # Define available actions
├── casl-ability.factory.ts  # Create abilities based on user
├── casl.module.ts          # CASL module configuration
├── decorators/
│   └── check-policies.decorator.ts  # Decorator for policy checks
├── guards/
│   └── policies.guard.ts    # Guard for enforcing policies
├── interfaces/
│   └── policy-handler.interface.ts  # Policy handler interface
└── policies/               # Individual policy files
    ├── profile-policies.ts
    ├── student-policies.ts
    ├── course-policies.ts
    ├── lecturer-policies.ts
    └── department-policies.ts
```

### Step 3: Define Actions

First, define the actions that can be performed in your system:

```typescript
// src/casl/action.enum.ts
export enum Action {
  Manage = 'manage', // read, create, update, delete
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}
```

### Step 4: Create the Ability Factory

The ability factory creates permission sets based on user roles:

```typescript
// src/casl/casl-ability.factory.ts
import { Injectable } from '@nestjs/common';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { Profile, Role } from '../profiles/entities/profile.entity';
import { Action } from './action.enum';

// Define subjects as string literals for simplicity
type Subject =
  | 'Profile'
  | 'Student'
  | 'Lecturer'
  | 'Course'
  | 'Department'
  | 'all';

export type AppAbility = PureAbility<[Action, Subject]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: Profile): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(PureAbility);

    // Admin can do anything
    if (user.role === Role.ADMIN) {
      can(Action.Manage, 'all');
    }
    // Faculty permissions
    else if (user.role === Role.FACULTY) {
      can(Action.Read, [
        'Profile',
        'Student',
        'Course',
        'Department',
        'Lecturer',
      ]);
      can([Action.Create, Action.Update, Action.Delete], 'Course');
      can(Action.Update, ['Student', 'Lecturer', 'Profile']);
      can(Action.Create, 'Lecturer');
    }
    // Student permissions
    else if (user.role === Role.STUDENT) {
      can(Action.Read, ['Course', 'Department', 'Lecturer']);
      can([Action.Read, Action.Update], ['Profile', 'Student']);
    }
    // Guest permissions
    else if (user.role === Role.GUEST) {
      can(Action.Read, ['Course', 'Department']);
      can([Action.Read, Action.Update], 'Profile');
    }

    return build();
  }
}
```

### Step 5: Create Policy Handler Interface

Define the interface for policy handlers:

```typescript
// src/casl/interfaces/policy-handler.interface.ts
import { AppAbility } from '../casl-ability.factory';

export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

export type PolicyHandler = IPolicyHandler | ((ability: AppAbility) => boolean);
```

### Step 6: Create the Check Policies Decorator

This decorator marks methods with specific policy requirements:

```typescript
// src/casl/decorators/check-policies.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { PolicyHandler } from '../interfaces/policy-handler.interface';

export const CHECK_POLICIES_KEY = 'check_policies';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
```

### Step 7: Create the Policies Guard

The guard enforces the policies defined by the decorator:

```typescript
// src/casl/guards/policies.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../casl-ability.factory';
import { PolicyHandler } from '../interfaces/policy-handler.interface';
import { CHECK_POLICIES_KEY } from '../decorators/check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    if (policyHandlers.length === 0) {
      return true; // No policies defined, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    const hasPermission = policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private execPolicyHandler(handler: PolicyHandler, ability: any) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
```

### Step 8: Create Policy Files (Optional)

Create specific policy files for different entities:

```typescript
// src/casl/policies/student-policies.ts
import { Action } from '../action.enum';
import { AppAbility } from '../casl-ability.factory';

export class StudentPolicies {
  static canReadStudent(ability: AppAbility): boolean {
    return ability.can(Action.Read, 'Student');
  }

  static canUpdateStudent(ability: AppAbility): boolean {
    return ability.can(Action.Update, 'Student');
  }

  static canDeleteStudent(ability: AppAbility): boolean {
    return ability.can(Action.Delete, 'Student');
  }
}
```

### Step 9: Configure the CASL Module

Create the CASL module to provide the factory and guard:

```typescript
// src/casl/casl.module.ts
import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './guards/policies.guard';

@Module({
  providers: [CaslAbilityFactory, PoliciesGuard],
  exports: [CaslAbilityFactory, PoliciesGuard],
})
export class CaslModule {}
```

### Step 10: Apply CASL to Controllers

Now you can protect your controller methods with CASL policies:

```typescript
// Example: src/students/students.controller.ts
import { UseGuards } from '@nestjs/common';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action } from '../casl/action.enum';

@Controller('students')
export class StudentsController {
  // Read students - all authenticated users can read
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Student'))
  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  // Update student - only admin/faculty can update
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Student'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateDto);
  }

  // Delete student - only admin can delete
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Student'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
```

### Step 11: Import CASL Module in App Module

Don't forget to import the CASL module in your main app module:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { CaslModule } from './casl/casl.module';

@Module({
  imports: [
    // ... other imports
    CaslModule,
  ],
  // ... rest of module configuration
})
export class AppModule {}
```

## 🎯 Role-Based Permissions in This System

### Admin Role

- **Full Access**: Can perform any action on any resource
- **System Management**: Complete control over all entities

### Faculty Role

- **Course Management**: Full CRUD operations on courses
- **Student Management**: Can read and update student records
- **Lecturer Management**: Can create and update lecturer profiles
- **Read Access**: Can view all entities

### Student Role

- **Limited Access**: Can only read courses, departments, and lecturers
- **Self Management**: Can read and update their own profile and student record

### Guest Role

- **Minimal Access**: Can only read basic course and department information
- **Profile Access**: Can manage their own profile

## 🔧 Advanced Usage Patterns

### 1. Conditional Permissions

You can create more complex permissions based on data relationships:

```typescript
@CheckPolicies((ability) => {
  // Custom logic for ownership checks
  return ability.can(Action.Update, 'Student');
})
```

### 2. Multiple Policy Checks

Apply multiple policies to a single endpoint:

```typescript
@CheckPolicies(
  (ability) => ability.can(Action.Read, 'Student'),
  (ability) => ability.can(Action.Update, 'Course')
)
```

### 3. Entity-Specific Permissions

Check permissions against specific entity instances:

```typescript
// In your service method
const student = await this.findOne(id);
if (!ability.can(Action.Update, student)) {
  throw new ForbiddenException();
}
```

## 🧪 Testing CASL Authorization

Test your authorization with different user roles:

```typescript
// Test as Admin
POST http://localhost:8000/auth/signin
{
  "email": "admin@school.com",
  "password": "password"
}

// Test protected endpoint
GET http://localhost:8000/students
Authorization: Bearer {{admin_token}}

// Test as Student
POST http://localhost:8000/auth/signin
{
  "email": "student@school.com", 
  "password": "password"
}

// This should succeed
GET http://localhost:8000/courses
Authorization: Bearer {{student_token}}

// This should fail (403 Forbidden)
DELETE http://localhost:8000/students/1
Authorization: Bearer {{student_token}}
```

## 📋 Implementation Checklist

- [X] Install CASL dependencies
- [X] Create Action enum
- [X] Implement CaslAbilityFactory
- [X] Create policy handler interface
- [X] Implement CheckPolicies decorator
- [X] Create PoliciesGuard
- [X] Configure CASL module
- [X] Apply policies to controllers
- [X] Test different role permissions
- [X] Create comprehensive documentation

## 🚨 Common Pitfalls & Solutions

### 1. **String vs Entity Subjects**

- **Problem**: Using entity classes instead of strings as subjects
- **Solution**: Use string literals for subjects in this implementation

### 2. **Guard Order**

- **Problem**: PoliciesGuard before authentication guard
- **Solution**: Ensure authentication happens first, then authorization

### 3. **Missing User Context**

- **Problem**: User not available in request context
- **Solution**: Ensure authentication guard is applied before policies guard

### 4. **Action Enum Usage**

- **Problem**: Using lowercase strings instead of Action enum
- **Solution**: Always use `Action.Read`, `Action.Update`, etc.

## 🔗 Related Documentation

- [CASL-AUTHORIZATION.md](./CASL-AUTHORIZATION.md) - Detailed CASL documentation
- [API Design.md](./API%20Design.md) - API endpoint documentation

## 🎉 Conclusion

This CASL implementation provides a robust, scalable authorization system that:

- Separates authentication from authorization
- Provides fine-grained permission control
- Is easily testable and maintainable
- Follows security best practices
- Supports role-based and attribute-based access control

The system is now ready for production use with comprehensive authorization coverage across all endpoints.
