import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateLectureDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  course_id: number; // Foreign key to the course

  @IsInt()
  duration: number; // Duration in minutes

  @IsDateString()
  lecture_date: string;

  @IsString()
  @IsOptional()
  materials?: string; // Links or file paths for materials (e.g., slides, videos)
}
