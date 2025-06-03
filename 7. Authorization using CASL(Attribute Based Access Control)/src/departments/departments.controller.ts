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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { Profile, Role } from '../profiles/entities/profile.entity';

interface RequestWithUser extends Request {
  user: Profile;
}

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Department'))
  @Post()
  create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin can create departments
    if (user.role === Role.ADMIN) {
      return this.departmentsService.create(createDepartmentDto);
    }
    throw new ForbiddenException('Unauthorized to create departments');
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Department'))
  @Get()
  findAll(@Query('search') search?: string) {
    // All authenticated users can read departments
    return this.departmentsService.findAll(search);
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Department'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // All authenticated users can read individual departments
    return this.departmentsService.findOne(id);
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Department'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    // Only admin can update departments
    if (user.role === Role.ADMIN) {
      return this.departmentsService.update(id, updateDepartmentDto);
    }
    throw new ForbiddenException('Unauthorized to update departments');
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Department'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = req.user;
    // Only admin can delete departments
    if (user.role === Role.ADMIN) {
      return this.departmentsService.remove(id);
    }
    throw new ForbiddenException('Unauthorized to delete departments');
  }
}
