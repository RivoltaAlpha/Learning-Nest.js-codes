import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsDateString()
  enrollmentDate: string;

  @IsInt()
  @IsOptional()
  departmentId?: number; // Optional department for students

  @IsString()
  degreeProgram: string; // e.g., "BSc Computer Science"
}
