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
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { Profile, Role } from '../profiles/entities/profile.entity';

interface RequestWithUser extends Request {
  user: Profile;
}

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // http://localhost:8000/students
  @Public()
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  // http://localhost:8000/students?name=John
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Student'))
  @Get()
  findAll(@Query('name') name?: string) {
    return this.studentsService.findAll(name);
  }

  // http://localhost:8000/students/1
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Student'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = req.user;
    // Students can only view their own record, faculty and admin can view all
    if (
      user.role === Role.ADMIN ||
      user.role === Role.FACULTY ||
      (user.role === Role.STUDENT && this.checkStudentOwnership(user.id, id))
    ) {
      return this.studentsService.findOne(id);
    }
    throw new ForbiddenException('Unauthorized access to student record');
  }

  // http://localhost:8000/students/1
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Student'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Students can update their own record, faculty and admin can update all
    if (
      user.role === Role.ADMIN ||
      user.role === Role.FACULTY ||
      (user.role === Role.STUDENT && this.checkStudentOwnership(user.id, id))
    ) {
      return this.studentsService.update(id, updateStudentDto);
    }
    throw new ForbiddenException('Unauthorized to update student record');
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Student'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = req.user;
    // Only admin can delete student records
    if (user.role === Role.ADMIN) {
      return this.studentsService.remove(id);
    }
    throw new ForbiddenException('Unauthorized to delete student records');
  }

  // Helper method to check if student owns the record
  private checkStudentOwnership(userId: number, studentId: number): boolean {
    // This would need to be implemented based on your business logic
    // For now, returning true as a placeholder
    // In real implementation, you would check if the profile.id matches
    // the student record's profileId
    console.log(
      `Checking ownership for user ${userId} and student ${studentId}`,
    );
    return true;
  }

  // http://localhost:8000/students/1/courses
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Student'))
  @Get(':id/courses')
  getStudentCourses(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (
      user.role === Role.ADMIN ||
      user.role === Role.FACULTY ||
      (user.role === Role.STUDENT && this.checkStudentOwnership(user.id, id))
    ) {
      return this.studentsService.getStudentCourses(id);
    }
    throw new ForbiddenException('Unauthorized access to student courses');
  }

  // http://localhost:8000/students/1/courses/2
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Student'))
  @Post(':studentId/courses/:courseId')
  enrollStudentInCourse(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (
      user.role === Role.ADMIN ||
      user.role === Role.FACULTY ||
      (user.role === Role.STUDENT &&
        this.checkStudentOwnership(user.id, studentId))
    ) {
      return this.studentsService.enrollStudentInCourse(studentId, courseId);
    }
    throw new ForbiddenException('Unauthorized to enroll student in course');
  }

  // http://localhost:8000/students/1/courses/2
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Student'))
  @Delete(':studentId/courses/:courseId')
  unenrollStudentFromCourse(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (
      user.role === Role.ADMIN ||
      user.role === Role.FACULTY ||
      (user.role === Role.STUDENT &&
        this.checkStudentOwnership(user.id, studentId))
    ) {
      return this.studentsService.unenrollStudentFromCourse(
        studentId,
        courseId,
      );
    }
    throw new ForbiddenException(
      'Unauthorized to unenroll student from course',
    );
  }

  // http://localhost:8000/students/1/courses
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Student'))
  @Patch(':id/courses')
  updateStudentCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() courseIds: number[],
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (
      user.role === Role.ADMIN ||
      user.role === Role.FACULTY ||
      (user.role === Role.STUDENT && this.checkStudentOwnership(user.id, id))
    ) {
      return this.studentsService.updateStudentCourses(id, courseIds);
    }
    throw new ForbiddenException('Unauthorized to update student courses');
  }
}
