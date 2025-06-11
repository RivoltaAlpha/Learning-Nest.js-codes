import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Role } from '../entities/profile.entity'; // Adjust the import path as necessary

export class CreateProfileDto {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    description: 'The password for the user account',
    example: 'strongpassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;

  @ApiProperty({
    description: 'The role of the user in the system',
    enum: Role,
    example: Role.STUDENT,
    default: Role.GUEST,
  })
  @IsString()
  @IsEnum(Role, {
    message:
      'Role must be one of the following: student, faculty, administrator',
  })
  role: Role = Role.GUEST; // Default role set to GUEST
}
