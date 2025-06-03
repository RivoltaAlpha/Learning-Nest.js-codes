import { Injectable } from '@nestjs/common';
import { Action } from '../action.enum';
import { AppAbility } from '../casl-ability.factory';

@Injectable()
export class LecturerPolicies {
  static read(ability: AppAbility) {
    return ability.can(Action.Read, 'Lecturer');
  }

  static create(ability: AppAbility) {
    return ability.can(Action.Create, 'Lecturer');
  }

  static update(ability: AppAbility) {
    return ability.can(Action.Update, 'Lecturer');
  }

  static delete(ability: AppAbility) {
    return ability.can(Action.Delete, 'Lecturer');
  }
}
