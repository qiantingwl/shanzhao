import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ImageAuditService } from '../common/services/image-audit.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [ImageAuditService],
})
export class UploadModule {}
