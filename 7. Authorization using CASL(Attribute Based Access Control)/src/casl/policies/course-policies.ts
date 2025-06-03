import { Injectable } from '@nestjs/common';
import { Action } from '../action.enum';
import { AppAbility } from '../casl-ability.factory';

@Injectable()
export class CoursePolicies {
  static read(ability: AppAbility) {
    return ability.can(Action.Read, 'Course');
  }

  static create(ability: AppAbility) {
    return ability.can(Action.Create, 'Course');
  }

  static update(ability: AppAbility) {
    return ability.can(Action.Update, 'Course');
  }

  static delete(ability: AppAbility) {
    return ability.can(Action.Delete, 'Course');
  }

  static manage(ability: AppAbility) {
    return ability.can(Action.Manage, 'Course');
  }
}
