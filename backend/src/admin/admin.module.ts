import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flash } from '../entities/flash.entity';
import { FlashRecord } from '../entities/flash-record.entity';
import { User } from '../entities/user.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { UserBan } from '../entities/user-ban.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Flash, FlashRecord, User, AdminUser, UserBan]),
    ConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
