import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';
import { CoursesModule } from './courses/courses.module';
import { LecturesModule } from './lectures/lectures.module';
import { DepartmentsModule } from './departments/departments.module';
import { StudentsModule } from './students/students.module';
import { ConfigModule } from '@nestjs/config';
import { ProfileModule } from './profiles/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CoursesModule,
    LecturesModule,
    DepartmentsModule,
    StudentsModule,
    ProfileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('students', 'courses', 'lectures', 'departments');
  }
}
