import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  name: string;

  @IsNumber()
  age: number;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsNumber()
  departmentId: number;

  @IsOptional()
  @IsNumber()
  enrolledCourseID: number;
}
