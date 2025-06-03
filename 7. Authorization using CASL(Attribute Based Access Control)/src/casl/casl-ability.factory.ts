import { Injectable } from '@nestjs/common';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { Profile, Role } from '../profiles/entities/profile.entity';
import { Action } from './action.enum';

// Define a simple type for subjects
type Subject =
  | 'Profile'
  | 'Student'
  | 'Lecturer'
  | 'Course'
  | 'Department'
  | 'all';

// Define the type of Ability we're using
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
      // Faculty can read all entities
      can(Action.Read, [
        'Profile',
        'Student',
        'Course',
        'Department',
        'Lecturer',
      ]);

      // Faculty can manage courses
      can([Action.Create, Action.Update, Action.Delete], 'Course');

      // Faculty can update students and lecturers
      can(Action.Update, ['Student', 'Lecturer', 'Profile']);

      // Faculty can create lecturer profiles
      can(Action.Create, 'Lecturer');
    }
    // Student permissions
    else if (user.role === Role.STUDENT) {
      // Students can read courses, departments, and lecturers
      can(Action.Read, ['Course', 'Department', 'Lecturer']);

      // Students can manage their own profile and student record
      can([Action.Read, Action.Update], ['Profile', 'Student']);
    }
    // Guest permissions (very limited)
    else if (user.role === Role.GUEST) {
      // Guests can only read basic information
      can(Action.Read, ['Course', 'Department']);

      // Guests can manage their own profile
      can([Action.Read, Action.Update], 'Profile');
    }

    return build();
  }
}
