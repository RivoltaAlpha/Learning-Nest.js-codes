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
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { Profile, Role } from '../profiles/entities/profile.entity';

interface RequestWithUser extends Request {
  user: Profile;
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // http://localhost:3000/courses
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Course'))
  @Post()
  create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin and faculty can create courses
    if (user.role === Role.ADMIN || user.role === Role.FACULTY) {
      return this.coursesService.create(createCourseDto);
    }
    throw new ForbiddenException('Unauthorized to create courses');
  }

  // http://localhost:3000/courses?search=Math
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Course'))
  @Get()
  findAll(@Query('search') search?: string) {
    // All authenticated users can read courses
    return this.coursesService.findAll(search);
  }

  // http://localhost:3000/courses/1
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Course'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // All authenticated users can read individual courses
    return this.coursesService.findOne(id);
  }

  // http://localhost:3000/courses/1
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Course'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin and faculty can update courses
    if (user.role === Role.ADMIN || user.role === Role.FACULTY) {
      return this.coursesService.update(id, updateCourseDto);
    }
    throw new ForbiddenException('Unauthorized to update courses');
  }

  // http://localhost:3000/courses/1
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Course'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = req.user;
    // Only admin can delete courses
    if (user.role === Role.ADMIN) {
      return this.coursesService.remove(id);
    }
    throw new ForbiddenException('Unauthorized to delete courses');
  }

  // Endpoints for managing course enrollments

  // http://localhost:3000/courses/1/students
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Course'))
  @Get(':id/students')
  getEnrolledStudents(@Param('id', ParseIntPipe) id: number) {
    // All authenticated users can view enrolled students
    return this.coursesService.getEnrolledStudents(id);
  }

  // http://localhost:3000/courses/1/students/2
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Course'))
  @Post(':courseId/students/:studentId')
  addStudentToCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin and faculty can manage course enrollments
    if (user.role === Role.ADMIN || user.role === Role.FACULTY) {
      return this.coursesService.addStudentToCourse(courseId, studentId);
    }
    throw new ForbiddenException('Unauthorized to manage course enrollments');
  }

  // http://localhost:3000/courses/1/students/2
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Course'))
  @Delete(':courseId/students/:studentId')
  removeStudentFromCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin and faculty can manage course enrollments
    if (user.role === Role.ADMIN || user.role === Role.FACULTY) {
      return this.coursesService.removeStudentFromCourse(courseId, studentId);
    }
    throw new ForbiddenException('Unauthorized to manage course enrollments');
  }
}
