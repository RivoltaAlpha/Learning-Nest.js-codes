import { Injectable } from '@nestjs/common';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';

@Injectable()
export class LecturesService {
  create(createLectureDto: CreateLectureDto) {
    return `This action adds a new lecture: ${JSON.stringify(createLectureDto)}`;
  }

  findAll(search?: string) {
    if (search) {
      return `This action returns lectures matching: ${search}`;
    }
    return `This action returns all lectures`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lecture`;
  }

  update(id: number, updateLectureDto: UpdateLectureDto) {
    return `This action updates a #${id} lecture with: ${JSON.stringify(updateLectureDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} lecture`;
  }
}
