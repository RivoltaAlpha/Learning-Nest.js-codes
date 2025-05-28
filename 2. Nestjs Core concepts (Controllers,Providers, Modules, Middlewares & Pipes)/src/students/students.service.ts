import { Injectable } from '@nestjs/common';
import { CreateStudentDto, UpdateStudentDto } from './dto';

@Injectable()
export class StudentsService {
  create(createStudentDto: CreateStudentDto) {
    return createStudentDto;
  }

  findAll(search?: string) {
    if (search) {
      return `This action returns all students matching the search term: ${search}`;
    }
    return `This action returns all students`;
  }

  findOne(id: number) {
    return `This action returns a #${id} student`;
  }

  update(id: number, updateStudentDto: UpdateStudentDto) {
    return { id, ...updateStudentDto };
  }

  remove(id: number) {
    return `This action removes a #${id} student`;
  }
}
