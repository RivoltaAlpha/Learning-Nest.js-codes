import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateLecturerDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  specialization: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  officeLocation?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsNumber()
  profileId: number; // Reference to existing profile
}
