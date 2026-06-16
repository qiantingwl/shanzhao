import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Help } from '../entities/help.entity';
import { UserBan } from '../entities/user-ban.entity';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [TypeOrmModule.forFeature([Help, UserBan])],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
