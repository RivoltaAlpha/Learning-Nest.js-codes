import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  department_id: number; // Assuming department_id is a number representing the department

  @IsInt()
  credits: number;

  @IsString()
  @IsOptional()
  duration?: string; // e.g., "6 weeks"

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;
}
