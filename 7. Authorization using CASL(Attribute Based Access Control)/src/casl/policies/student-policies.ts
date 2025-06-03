import { Injectable } from '@nestjs/common';
import { Action } from '../action.enum';
import { AppAbility } from '../casl-ability.factory';

@Injectable()
export class StudentPolicies {
  static read(ability: AppAbility) {
    return ability.can(Action.Read, 'Student');
  }

  static create(ability: AppAbility) {
    return ability.can(Action.Create, 'Student');
  }

  static update(ability: AppAbility) {
    return ability.can(Action.Update, 'Student');
  }

  static delete(ability: AppAbility) {
    return ability.can(Action.Delete, 'Student');
  }
}
