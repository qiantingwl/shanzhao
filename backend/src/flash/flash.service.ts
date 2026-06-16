import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Flash, FlashStatus } from '../entities/flash.entity';
import { FlashRecord } from '../entities/flash-record.entity';
import { SysConfigService } from '../config/config.service';

@Injectable()
export class FlashService {
  constructor(
    @InjectRepository(Flash) private flashRepo: Repository<Flash>,
    @InjectRepository(FlashRecord) private recordRepo: Repository<FlashRecord>,
    private configService: SysConfigService,
  ) {}

  async create(
    userId: string,
    dto: {
      filePath: string;
      fileThumb?: string;
      fileShare?: string;
      fileMasai?: string;
      fileOrigin?: string;
      originFlag?: string;
      screenFlag?: string;
      shareFlag?: string;
      adFlag?: string;
      maxNum?: number;
      maxSec?: number;
    },
  ) {
    const [defaultMaxNum, defaultMaxSec] = await Promise.all([
      this.configService.getNumber('default_max_num', 1),
      this.configService.getNumber('default_max_sec', 3),
    ]);
    const flash = this.flashRepo.create({
      authorId: userId,
      filePath: dto.filePath,
      fileThumb: dto.fileThumb,
      fileShare: dto.fileShare,
      fileMasai: dto.fileMasai,
      fileOrigin: dto.fileOrigin ?? '0',
      originFlag: dto.originFlag ?? '1',
      screenFlag: dto.screenFlag ?? '1',
      shareFlag: dto.shareFlag ?? '1',
      adFlag: dto.adFlag ?? '0',
      maxNum: dto.maxNum ?? defaultMaxNum,
      maxSec: dto.maxSec ?? defaultMaxSec,
      status: FlashStatus.PUBLISHED,
    });
    return this.flashRepo.save(flash);
  }

  async getMyList(userId: string, page = 1, pageSize = 20) {
    const [list, total] = await this.flashRepo.findAndCount({
      where: { authorId: userId, delFlag: '0' },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async getDetail(id: string, userId: string) {
    const flash = await this.flashRepo.findOne({ where: { id, delFlag: '0' } });
    if (!flash) throw new NotFoundException('闪图不存在');
    if (flash.authorId !== userId) throw new ForbiddenException('无权查看');

    const recordCount = await this.recordRepo.count({
      where: { flashId: id, recordMode: In(['0', '1']) },
    });
    return { ...flash, viewCount: recordCount };
  }

  async delete(id: string, userId: string) {
    const flash = await this.flashRepo.findOne({
      where: { id, authorId: userId, delFlag: '0' },
    });
    if (!flash) throw new NotFoundException('闪图不存在');
    flash.delFlag = '1';
    await this.flashRepo.save(flash);
    return { success: true };
  }

  async revoke(id: string, userId: string) {
    const flash = await this.flashRepo.findOne({
      where: { id, authorId: userId, delFlag: '0' },
    });
    if (!flash) throw new NotFoundException('闪图不存在');
    flash.status = FlashStatus.REVOKED;
    await this.flashRepo.save(flash);
    return { success: true };
  }

  async getViewRecords(
    flashId: string,
    userId: string,
    page = 1,
    pageSize = 20,
  ) {
    const flash = await this.flashRepo.findOne({
      where: { id: flashId, authorId: userId },
    });
    if (!flash) throw new NotFoundException('闪图不存在');

    const [list, total] = await this.recordRepo.findAndCount({
      where: { flashId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: { user: true },
    });
    return { list, total };
  }

  async recordView(
    flashId: string,
    viewerId: string,
    dto: { viewSec?: number; screenFlag?: string },
  ) {
    const flash = await this.flashRepo.findOne({
      where: { id: flashId, delFlag: '0', status: FlashStatus.PUBLISHED },
    });
    if (!flash) throw new NotFoundException('闪图不存在或已撤回');

    const [viewed, adUnlocks] = await Promise.all([
      this.recordRepo.count({
        where: { flashId, recordMode: In(['0', '1']) },
      }),
      this.recordRepo.count({
        where: { flashId, recordMode: '2' },
      }),
    ]);
    if (viewed >= flash.maxNum + adUnlocks) {
      return { canView: false, reason: '查看次数已达上限' };
    }

    const record = this.recordRepo.create({
      flashId,
      userId: viewerId,
      recordMode: viewed === 0 ? '0' : '1',
      viewSec: dto.viewSec ?? flash.maxSec,
      screenFlag: dto.screenFlag ?? '0',
    });
    await this.recordRepo.save(record);
    return { canView: true, flash };
  }

  async getFlashForViewer(flashId: string) {
    const flash = await this.flashRepo.findOne({
      where: { id: flashId, delFlag: '0', status: FlashStatus.PUBLISHED },
      select: {
        id: true,
        filePath: true,
        fileThumb: true,
        fileMasai: true,
        fileShare: true,
        fileOrigin: true,
        originFlag: true,
        screenFlag: true,
        shareFlag: true,
        adFlag: true,
        maxNum: true,
        maxSec: true,
        status: true,
        createdAt: true,
      },
    });
    if (!flash) throw new NotFoundException('闪图不存在或已撤回');
    return flash;
  }

  async getRemain(flashId: string) {
    const flash = await this.flashRepo.findOne({
      where: { id: flashId, delFlag: '0', status: FlashStatus.PUBLISHED },
    });
    if (!flash) throw new NotFoundException('闪图不存在');
    const [viewed, adUnlocks] = await Promise.all([
      this.recordRepo.count({
        where: { flashId, recordMode: In(['0', '1']) },
      }),
      this.recordRepo.count({ where: { flashId, recordMode: '2' } }),
    ]);
    const total = flash.maxNum + adUnlocks;
    const remain = Math.max(0, total - viewed);
    return { remain, total, viewed, adUnlocks, adFlag: flash.adFlag };
  }

  async adUnlock(flashId: string, userId: string) {
    const flash = await this.flashRepo.findOne({
      where: { id: flashId, delFlag: '0', status: FlashStatus.PUBLISHED },
    });
    if (!flash) throw new NotFoundException('闪图不存在');
    const adEnabled = await this.configService.getBool(
      'ad_unlock_enabled',
      true,
    );
    if (!adEnabled) throw new ForbiddenException('广告解锁未开启');
    const record = this.recordRepo.create({
      flashId,
      userId,
      recordMode: '2',
      viewSec: 0,
      screenFlag: '0',
    });
    await this.recordRepo.save(record);
    return { success: true };
  }

  async recordShare(flashId: string, userId: string) {
    const flash = await this.flashRepo.findOne({
      where: { id: flashId, delFlag: '0', status: FlashStatus.PUBLISHED },
    });
    if (!flash) throw new NotFoundException('闪图不存在');
    const record = this.recordRepo.create({
      flashId,
      userId,
      recordMode: '3',
      viewSec: 0,
      screenFlag: '0',
    });
    await this.recordRepo.save(record);
    return { success: true };
  }
}
