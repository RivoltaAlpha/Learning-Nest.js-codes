import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Profile]), CaslModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfileModule {}
