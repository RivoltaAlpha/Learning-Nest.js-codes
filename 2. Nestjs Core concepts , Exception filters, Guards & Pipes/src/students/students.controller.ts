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
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';

// @BOdy() == req.body
// @Param() == req.params
// @Query() == req.query
// @Headers() == req.headers
// @Session() == req.session
// @Req() == req
// @Res() == res

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // http://localhost:3000/students
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  // http://localhost:3000/students?search=John
  @Get()
  findAll(@Query('search') search?: string) {
    return this.studentsService.findAll(search);
  }

  // http://localhost:3000/students/1
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  // http://localhost:3000/students/1
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  // http://localhost:3000/students/1
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
