import { Injectable } from '@nestjs/common';
import { Action } from '../action.enum';
import { AppAbility } from '../casl-ability.factory';

@Injectable()
export class DepartmentPolicies {
  static read(ability: AppAbility) {
    return ability.can(Action.Read, 'Department');
  }

  static create(ability: AppAbility) {
    return ability.can(Action.Create, 'Department');
  }

  static update(ability: AppAbility) {
    return ability.can(Action.Update, 'Department');
  }

  static delete(ability: AppAbility) {
    return ability.can(Action.Delete, 'Department');
  }

  static manage(ability: AppAbility) {
    return ability.can(Action.Manage, 'Department');
  }
}
