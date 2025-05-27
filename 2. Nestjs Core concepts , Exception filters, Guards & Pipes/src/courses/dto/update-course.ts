import { CreateCourseDto } from './create-course';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateCourceDto extends PartialType(CreateCourseDto) {}
