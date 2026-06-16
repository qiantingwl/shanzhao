import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysConfig } from '../entities/config.entity';
import { SysConfigService } from './config.service';
import { SysConfigController } from './config.controller';
import { CleanupTask } from './cleanup.task';
import { Flash } from '../entities/flash.entity';
import { StorageService } from '../common/services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([SysConfig, Flash])],
  controllers: [SysConfigController],
  providers: [SysConfigService, CleanupTask, StorageService],
  exports: [SysConfigService, StorageService],
})
export class ConfigModule {}
