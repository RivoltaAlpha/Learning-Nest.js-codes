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
import { LecturesService } from './lectures.service';
import { CreateLectureDto, UpdateLectureDto } from './dto';

@Controller('lectures')
export class LecturesController {
  constructor(private readonly lecturesService: LecturesService) {}

  // http://localhost:3000/lectures
  @Post()
  create(@Body() createLectureDto: CreateLectureDto) {
    return this.lecturesService.create(createLectureDto);
  }

  // http://localhost:3000/lectures?search=Math
  @Get()
  findAll(@Query('search') search?: string) {
    return this.lecturesService.findAll(search);
  }

  // http://localhost:3000/lectures/1
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lecturesService.findOne(id);
  }

  // http://localhost:3000/lectures/1
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLectureDto: UpdateLectureDto,
  ) {
    return this.lecturesService.update(id, updateLectureDto);
  }

  // http://localhost:3000/lectures/1
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lecturesService.remove(id);
  }
}
