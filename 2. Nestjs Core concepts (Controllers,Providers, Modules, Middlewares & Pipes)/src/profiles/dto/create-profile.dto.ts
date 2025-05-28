import { IsString, IsNotEmpty, IsEmail, IsEnum } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsEnum(['student', 'faculty', 'administrator'])
  role: 'student' | 'faculty' | 'administrator';
}
