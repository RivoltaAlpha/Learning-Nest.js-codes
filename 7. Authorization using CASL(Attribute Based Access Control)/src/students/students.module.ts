import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { DatabaseModule } from 'src/database/database.module';
import { Student } from './entities/student.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/profiles/entities/profile.entity';
import { Course } from '../courses/entities/course.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Student, Profile, Course]),
    CaslModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
