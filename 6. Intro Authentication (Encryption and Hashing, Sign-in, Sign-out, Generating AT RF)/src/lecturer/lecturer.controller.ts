import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LecturerService } from './lecturer.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('lecturer')
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}

  @Public()
  @Post()
  create(@Body() createLecturerDto: CreateLecturerDto) {
    return this.lecturerService.create(createLecturerDto);
  }

  @Get()
  findAll(@Query('name') name?: string) {
    return this.lecturerService.findAll(name);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lecturerService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLecturerDto: UpdateLecturerDto,
  ) {
    return this.lecturerService.update(id, updateLecturerDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lecturerService.remove(id);
  }

  // Lecturer-Course assignment endpoints

  // Get all courses for a lecturer
  @Get(':id/courses')
  getLecturerCourses(@Param('id', ParseIntPipe) id: number) {
    return this.lecturerService.getLecturerCourses(id);
  }

  // Assign a lecturer to a course
  @Post(':lecturerId/courses/:courseId')
  assignLecturerToCourse(
    @Param('lecturerId', ParseIntPipe) lecturerId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.lecturerService.assignLecturerToCourse(lecturerId, courseId);
  }

  // Unassign a lecturer from a course
  @Delete(':lecturerId/courses/:courseId')
  unassignLecturerFromCourse(
    @Param('lecturerId', ParseIntPipe) lecturerId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.lecturerService.unassignLecturerFromCourse(
      lecturerId,
      courseId,
    );
  }

  // Update lecturer's courses (batch assignment)
  @Patch(':id/courses')
  updateLecturerCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() courseIds: number[],
  ) {
    return this.lecturerService.updateLecturerCourses(id, courseIds);
  }
}
