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
import { LecturerService } from './lecturer.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { Profile, Role } from '../profiles/entities/profile.entity';

interface RequestWithUser extends Request {
  user: Profile;
}

@Controller('lecturer')
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}

  @Public()
  @Post()
  create(@Body() createLecturerDto: CreateLecturerDto) {
    return this.lecturerService.create(createLecturerDto);
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Lecturer'))
  @Get()
  findAll(@Query('name') name?: string) {
    // All authenticated users can read lecturers
    return this.lecturerService.findAll(name);
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Lecturer'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // All authenticated users can read individual lecturers
    return this.lecturerService.findOne(id);
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Lecturer'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLecturerDto: UpdateLecturerDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin and faculty can update lecturer records
    if (user.role === Role.ADMIN || user.role === Role.FACULTY) {
      return this.lecturerService.update(id, updateLecturerDto);
    }
    throw new ForbiddenException('Unauthorized to update lecturer records');
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Lecturer'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = req.user;
    // Only admin can delete lecturer records
    if (user.role === Role.ADMIN) {
      return this.lecturerService.remove(id);
    }
    throw new ForbiddenException('Unauthorized to delete lecturer records');
  }

  // Lecturer-Course assignment endpoints

  // Get all courses for a lecturer
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Lecturer'))
  @Get(':id/courses')
  getLecturerCourses(@Param('id', ParseIntPipe) id: number) {
    // All authenticated users can view lecturer courses
    return this.lecturerService.getLecturerCourses(id);
  }

  // Assign a lecturer to a course
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Lecturer'))
  @Post(':lecturerId/courses/:courseId')
  assignLecturerToCourse(
    @Param('lecturerId', ParseIntPipe) lecturerId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin and faculty can assign lecturers to courses
    if (user.role === Role.ADMIN || user.role === Role.FACULTY) {
      return this.lecturerService.assignLecturerToCourse(lecturerId, courseId);
    }
    throw new ForbiddenException('Unauthorized to assign lecturer to course');
  }

  // Unassign a lecturer from a course
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Lecturer'))
  @Delete(':lecturerId/courses/:courseId')
  unassignLecturerFromCourse(
    @Param('lecturerId', ParseIntPipe) lecturerId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin and faculty can unassign lecturers from courses
    if (user.role === Role.ADMIN || user.role === Role.FACULTY) {
      return this.lecturerService.unassignLecturerFromCourse(
        lecturerId,
        courseId,
      );
    }
    throw new ForbiddenException(
      'Unauthorized to unassign lecturer from course',
    );
  }

  // Update lecturer's courses (batch assignment)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Lecturer'))
  @Patch(':id/courses')
  updateLecturerCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() courseIds: number[],
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin and faculty can update lecturer course assignments
    if (user.role === Role.ADMIN || user.role === Role.FACULTY) {
      return this.lecturerService.updateLecturerCourses(id, courseIds);
    }
    throw new ForbiddenException(
      'Unauthorized to update lecturer course assignments',
    );
  }
}
