import { Module } from '@nestjs/common';
import { LecturerService } from './lecturer.service';
import { LecturerController } from './lecturer.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lecturer } from './entities/lecturer.entity';
import { Profile } from 'src/profiles/entities/profile.entity';
import { Course } from 'src/courses/entities/course.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Lecturer, Profile, Course]),
    CaslModule,
  ],
  controllers: [LecturerController],
  providers: [LecturerService],
})
export class LecturerModule {}
