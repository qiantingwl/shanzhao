import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Flash } from '../entities/flash.entity';
import { SysConfigService } from './config.service';
import { StorageService } from '../common/services/storage.service';

@Injectable()
export class CleanupTask {
  private readonly logger = new Logger(CleanupTask.name);

  constructor(
    @InjectRepository(Flash) private flashRepo: Repository<Flash>,
    private sysConfig: SysConfigService,
    private storage: StorageService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupDeletedFlashes() {
    const [retainDays, retainUserDeleted] = await Promise.all([
      this.sysConfig.getNumber('retain_deleted_days', 30),
      this.sysConfig.getBool('retain_user_deleted', true),
    ]);

    if (retainUserDeleted) {
      this.logger.log('[cleanup] retain_user_deleted=1, skipped');
      return;
    }

    const cutoff = new Date(Date.now() - retainDays * 86_400_000);

    const expired = await this.flashRepo.find({
      where: {
        delFlag: '1',
        updatedAt: LessThan(cutoff),
      },
    });

    if (expired.length === 0) return;

    let removed = 0;
    for (const flash of expired) {
      try {
        if (flash.filePath) await this.storage.remove(flash.filePath);
        if (flash.fileThumb && flash.fileThumb !== flash.filePath) {
          await this.storage.remove(flash.fileThumb);
        }
        if (
          flash.fileMasai &&
          ![flash.filePath, flash.fileThumb].includes(flash.fileMasai)
        ) {
          await this.storage.remove(flash.fileMasai);
        }
        if (
          flash.fileShare &&
          ![flash.filePath, flash.fileThumb, flash.fileMasai].includes(
            flash.fileShare,
          )
        ) {
          await this.storage.remove(flash.fileShare);
        }
        await this.flashRepo.remove(flash);
        removed++;
      } catch (e: unknown) {
        this.logger.error(
          `[cleanup] failed to remove flashId=${flash.id}: ${String(e)}`,
        );
      }
    }
    this.logger.log(
      `[cleanup] removed ${removed}/${expired.length} expired records`,
    );
  }
}
