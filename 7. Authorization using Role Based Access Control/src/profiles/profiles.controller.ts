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
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Public()
  @Post()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }

  @Get()
  findAll(@Query('email') email?: string) {
    return this.profilesService.findAll(email);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.remove(id);
  }
}
