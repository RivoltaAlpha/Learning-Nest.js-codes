# CASL Authorization System Documentation

## Overview

This NestJS application implements a comprehensive authorization system using **CASL (Common Ability Schema Library)** for attribute-based access control (ABAC). The system builds upon existing JWT authentication to provide fine-grained, role-based permissions across all API endpoints.

## Architecture

### Core Components

1. **CaslAbilityFactory** (`src/casl/casl-ability.factory.ts`)
   - Central factory for creating user abilities based on roles
   - Defines role-based permissions for all entities
   - Handles ownership validation logic

2. **PoliciesGuard** (`src/casl/guards/policies.guard.ts`)
   - Custom guard that enforces CASL policies
   - Works in conjunction with existing AtGuard (JWT authentication)
   - Evaluates user abilities against requested actions

3. **Policy Handlers** (`src/casl/policies/`)
   - Reusable policy functions for each entity
   - Encapsulate complex authorization logic
   - Enable composition and reusability

4. **Decorators**
   - `@CheckPolicies()` - Apply authorization policies to routes
   - Can accept policy handlers or inline ability checks

## Role-Based Permissions

### ADMIN
- **Full Access**: Complete CRUD operations on all entities
- **User Management**: Can create, update, delete any user profile
- **System Administration**: Unrestricted access to all resources

### FACULTY
- **Courses**: Full CRUD operations (create, read, update, delete)
- **Students**: Read all, update student records and enrollments
- **Lecturers**: Read all, update lecturer assignments
- **Departments**: Read-only access
- **Profile**: Manage own profile

### STUDENT
- **Courses**: Read-only access to browse available courses
- **Departments**: Read-only access to view department information
- **Own Profile**: Full management of personal profile
- **Own Student Record**: View and update personal student information
- **Enrollments**: Manage own course enrollments

### GUEST
- **Limited Read Access**: View courses and departments only
- **Own Profile**: Basic profile management
- **No Administrative Rights**: Cannot modify system data

## Implementation Details

### Entity Protection

Each entity is protected with appropriate CASL policies:

#### Profiles
```typescript
// All users can read, only admins can manage others
@CheckPolicies(ProfilePolicies.read)
@CheckPolicies(ProfilePolicies.update) // Includes ownership validation
```

#### Students
```typescript
// Role-based access with ownership validation
@CheckPolicies((ability) => ability.can('read', 'Student'))
// Students can only access their own records
```

#### Courses
```typescript
// Faculty and admin can create/update, all can read
@CheckPolicies((ability) => ability.can('create', 'Course'))
@CheckPolicies((ability) => ability.can('update', 'Course'))
```

#### Lecturers
```typescript
// Admin and faculty can manage, all can read
@CheckPolicies((ability) => ability.can('update', 'Lecturer'))
```

#### Departments
```typescript
// Admin-only for modifications, all can read
@CheckPolicies((ability) => ability.can('create', 'Department'))
```

### Authentication Integration

The system enhances the existing JWT authentication:

```typescript
// Enhanced AtStrategy to fetch full user profile
async validate(payload: JwtPayload): Promise<Profile> {
  const user = await this.profilesService.findOne(payload.sub);
  if (!user) throw new UnauthorizedException('Access Denied');
  return user; // Returns full Profile entity with role information
}
```

### Guard Usage

Controllers use both authentication and authorization guards:

```typescript
@UseGuards(AtGuard, PoliciesGuard) // JWT + CASL
@CheckPolicies((ability) => ability.can('read', 'Student'))
@Get()
findAll() {
  // Protected endpoint
}
```

## Usage Examples

### Basic Policy Check
```typescript
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can('read', 'Course'))
@Get()
findAllCourses() {
  // All authenticated users can read courses
}
```

### Role-Based Access
```typescript
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can('create', 'Course'))
@Post()
createCourse(@Req() req: RequestWithUser) {
  const user = req.user;
  // Only admin and faculty can create courses
  if (user.role === Role.ADMIN || user.role === Role.FACULTY) {
    return this.coursesService.create(createCourseDto);
  }
  throw new ForbiddenException('Unauthorized to create courses');
}
```

### Ownership Validation
```typescript
@UseGuards(PoliciesGuard)
@CheckPolicies(ProfilePolicies.update)
@Patch(':id')
updateProfile(@Param('id') id: number, @Req() req: RequestWithUser) {
  // Policy automatically validates ownership for non-admin users
}
```

### Complex Policy Handlers
```typescript
// src/casl/policies/profile-policies.ts
export class ProfilePolicies {
  static update: PolicyHandler = (ability: AppAbility, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user as Profile;
    const profileId = parseInt(request.params.id);

    // Admin can update any profile
    if (user.role === Role.ADMIN) {
      return ability.can('update', 'Profile');
    }
    
    // Users can only update their own profile
    return ability.can('update', 'Profile') && user.id === profileId;
  };
}
```

## Security Features

### 1. **Layered Security**
- JWT authentication ensures user identity
- CASL authorization enforces permissions
- Role validation prevents privilege escalation

### 2. **Ownership Validation**
- Users can only access their own resources
- Automatic validation in policy handlers
- Prevents horizontal privilege escalation

### 3. **Fine-Grained Control**
- Action-level permissions (create, read, update, delete)
- Entity-specific rules
- Context-aware decisions

### 4. **Fail-Safe Defaults**
- Deny by default unless explicitly allowed
- Clear error messages for unauthorized access
- Comprehensive audit trail through guards

## Configuration

### Adding New Entities

1. **Define Actions** in `action.enum.ts`
2. **Add Entity Type** to CASL ability type definitions
3. **Create Policy Handlers** in `src/casl/policies/`
4. **Update CaslAbilityFactory** with entity-specific rules
5. **Apply Guards** to controller endpoints

### Modifying Permissions

Update the `CaslAbilityFactory.createForUser()` method:

```typescript
private defineAbilitiesFor(user: Profile) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(PureAbility);

  // Add new permission rules
  if (user.role === Role.NEW_ROLE) {
    can('read', 'NewEntity');
    can('update', 'NewEntity', { ownerId: user.id });
  }

  return build();
}
```

## Testing Authorization

### Unit Tests
```typescript
describe('Authorization', () => {
  it('should allow admin to access all resources', () => {
    const adminUser = { role: Role.ADMIN };
    const ability = caslAbilityFactory.createForUser(adminUser);
    expect(ability.can('manage', 'all')).toBeTruthy();
  });

  it('should restrict student access', () => {
    const studentUser = { role: Role.STUDENT };
    const ability = caslAbilityFactory.createForUser(studentUser);
    expect(ability.can('create', 'Course')).toBeFalsy();
  });
});
```

### Integration Tests
```typescript
describe('Protected Endpoints', () => {
  it('should deny unauthorized access', async () => {
    const response = await request(app)
      .post('/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(courseDto)
      .expect(403);
  });
});
```

## Best Practices

### 1. **Principle of Least Privilege**
- Grant minimum necessary permissions
- Regular audit of role permissions
- Remove unused permissions

### 2. **Explicit Permission Checks**
- Always use `@CheckPolicies()` decorator
- Validate ownership in sensitive operations
- Clear error messages for debugging

### 3. **Consistent Policy Structure**
- Use policy handler classes for reusability
- Document complex authorization logic
- Test edge cases thoroughly

### 4. **Performance Considerations**
- Cache ability instances when possible
- Optimize database queries for user data
- Monitor authorization overhead

## Troubleshooting

### Common Issues

1. **"Access Denied" Errors**
   - Verify JWT token is valid
   - Check user role in database
   - Ensure AtStrategy returns full Profile entity

2. **Policy Not Applied**
   - Confirm `@UseGuards(PoliciesGuard)` is present
   - Verify `@CheckPolicies()` decorator syntax
   - Check guard execution order

3. **Permission Denied for Valid Users**
   - Review ability definitions in CaslAbilityFactory
   - Validate ownership logic in policy handlers
   - Check role assignment in database

### Debug Mode

Enable detailed logging:

```typescript
// Add to main.ts for development
if (process.env.NODE_ENV === 'development') {
  app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
}
```

## Migration Guide

### From Basic Guards to CASL

1. **Install Dependencies**
   ```bash
   npm install @casl/ability
   ```

2. **Replace Simple Guards**
   ```typescript
   // Before
   @UseGuards(AtGuard, RolesGuard)
   @Roles('admin')
   
   // After
   @UseGuards(AtGuard, PoliciesGuard)
   @CheckPolicies((ability) => ability.can('manage', 'all'))
   ```

3. **Update Service Methods**
   - Remove role checks from services
   - Move authorization logic to controllers
   - Use policy handlers for complex rules

## Conclusion

This CASL implementation provides a robust, scalable authorization system that:

- **Enforces Role-Based Access Control** with fine-grained permissions
- **Prevents Unauthorized Access** through layered security
- **Scales with Application Growth** through modular policy design
- **Maintains Code Quality** with clear separation of concerns
- **Supports Compliance** through comprehensive audit capabilities

The system successfully transforms a simple JWT authentication setup into a enterprise-grade authorization framework suitable for production applications.
