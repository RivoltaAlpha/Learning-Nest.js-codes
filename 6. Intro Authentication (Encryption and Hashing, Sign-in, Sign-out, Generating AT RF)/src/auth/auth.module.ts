import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Profile } from 'src/profiles/entities/profile.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Profile]),
    JwtModule.register({
      global: true,
    }), // Register JwtModule with global configuration
    PassportModule, // Register PassportModule for strategies
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule { }
