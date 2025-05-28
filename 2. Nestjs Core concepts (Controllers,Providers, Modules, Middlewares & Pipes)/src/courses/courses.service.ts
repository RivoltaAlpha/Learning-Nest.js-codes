import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  create(createCourseDto: CreateCourseDto) {
    return `This action adds a new course: ${JSON.stringify(createCourseDto)}`;
  }

  findAll(search?: string) {
    if (search) {
      return `This action returns courses matching: ${search}`;
    }
    return `This action returns all courses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} course`;
  }

  update(id: number, updateCourseDto: UpdateCourseDto) {
    return `This action updates a #${id} course with: ${JSON.stringify(updateCourseDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} course`;
  }
}
