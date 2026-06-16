import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flash } from '../entities/flash.entity';
import { FlashRecord } from '../entities/flash-record.entity';
import { User } from '../entities/user.entity';
import { FlashController } from './flash.controller';
import { FlashPublicController } from './flash-public.controller';
import { FlashService } from './flash.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [TypeOrmModule.forFeature([Flash, FlashRecord, User]), ConfigModule],
  controllers: [FlashController, FlashPublicController],
  providers: [FlashService],
  exports: [FlashService],
})
export class FlashModule {}
