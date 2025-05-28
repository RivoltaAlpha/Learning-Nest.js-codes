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

@Controller('profile')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  // http://localhost:3000/profile
  @Post()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }

  // http://localhost:3000/profile?search=John
  @Get()
  findAll(@Query('search') search?: string) {
    return this.profilesService.findAll(search);
  }

  // http://localhost:3000/profile/1
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.findOne(id);
  }

  // http://localhost:3000/profile/1
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(id, updateProfileDto);
  }

  // http://localhost:3000/profile/1
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.remove(id);
  }
}
