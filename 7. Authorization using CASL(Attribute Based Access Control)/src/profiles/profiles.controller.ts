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
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { ProfilePolicies } from '../casl/policies/profile-policies';
import { Profile, Role } from './entities/profile.entity';

interface RequestWithUser extends Request {
  user: Profile;
}

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Public()
  @Post()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies(ProfilePolicies.read)
  @Get()
  findAll(@Query('email') email?: string) {
    return this.profilesService.findAll(email);
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Profile'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    // Check if user can read this specific profile or has general read permission
    const user = req.user;
    if (
      user.id === id ||
      user.role === Role.ADMIN ||
      user.role === Role.FACULTY
    ) {
      return this.profilesService.findOne(id);
    }
    throw new ForbiddenException('Unauthorized access to this profile');
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Profile'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: RequestWithUser,
  ) {
    // Users can only update their own profile unless they're admin
    const user = req.user;
    if (user.id === id || user.role === Role.ADMIN) {
      return this.profilesService.update(id, updateProfileDto);
    }
    throw new ForbiddenException('Unauthorized to update this profile');
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Profile'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    // Only admin can delete profiles
    const user = req.user;
    if (user.role === Role.ADMIN) {
      return this.profilesService.remove(id);
    }
    throw new ForbiddenException('Unauthorized to delete profiles');
  }
}
