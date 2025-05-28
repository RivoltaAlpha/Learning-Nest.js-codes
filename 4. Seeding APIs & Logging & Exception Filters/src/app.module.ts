import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';
import { StudentsModule } from './students/students.module';
import { ConfigModule } from '@nestjs/config';
import { ProfileModule } from './profiles/profile.module';
import { DatabaseModule } from './database/database.module';
import { DepartmentsModule } from './departments/departments.module';
import { CoursesModule } from './courses/courses.module';
import { SeedModule } from './seed/seed.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    StudentsModule,
    ProfileModule,
    DatabaseModule,
    DepartmentsModule,
    CoursesModule,
    SeedModule,
    LogsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('students', 'profiles', 'courses', 'lectures', 'departments');
  }
}
