import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  IsEmail,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateStudentDto {
  // Profile information
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(['student', 'faculty', 'admin', 'guest'])
  @IsOptional()
  role?: string = 'guest';

  // Student specific information
  @IsDateString()
  enrollment_date: string;

  @IsString()
  @IsOptional()
  degree_program?: string;

  @IsNumber()
  @Min(0)
  @Max(4.0)
  @IsOptional()
  gpa?: number;

  @IsInt()
  @IsOptional()
  department_id?: number;
}
