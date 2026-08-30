import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Between, In, Repository } from 'typeorm';
import { Flash, FlashStatus } from '../entities/flash.entity';
import { FlashRecord } from '../entities/flash-record.entity';
import { User } from '../entities/user.entity';
import { UserBan } from '../entities/user-ban.entity';
import { SysConfigService } from '../config/config.service';

@Injectable()
export class FlashService {
  constructor(
    @InjectRepository(Flash) private flashRepo: Repository<Flash>,
    @InjectRepository(FlashRecord) private recordRepo: Repository<FlashRecord>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserBan) private userBanRepo: Repository<UserBan>,
    private configService: SysConfigService,
    private envConfig: ConfigService,
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
      iosFlag?: string;
      pcFlag?: string;
      shareBlockFlag?: string;
      adFlag?: string;
      mode?: string;
      maxNum?: number;
      maxSec?: number;
    },
  ) {
    const [defaultMaxNum, defaultMaxSec] = await Promise.all([
      this.configService.getNumber('default_max_num', 1),
      this.configService.getNumber('default_max_sec', 3),
    ]);
    const mode = dto.mode === 'private' ? 'private' : 'entertainment';
    const configPrefix = mode === 'private' ? 'private' : 'entertainment';
    const defaultFlags = await this.configService.mget([
      `${configPrefix}_origin_enabled`,
      `${configPrefix}_screen_enabled`,
      `${configPrefix}_device_block_enabled`,
      `${configPrefix}_share_block_enabled`,
      `${configPrefix}_ad_enabled`,
    ]);
    const pickFlag = (key: string, fallback: string, incoming?: string) =>
      incoming ?? defaultFlags[`${configPrefix}_${key}_enabled`] ?? fallback;
    const shareBlockFlag =
      dto.shareBlockFlag ??
      defaultFlags[`${configPrefix}_share_block_enabled`] ??
      (mode === 'private' ? '1' : '0');
    const deviceBlockFlag =
      defaultFlags[`${configPrefix}_device_block_enabled`] ??
      (mode === 'private' ? '1' : '1');
    const flash = this.flashRepo.create({
      authorId: userId,
      filePath: dto.filePath,
      fileThumb: dto.fileThumb,
      fileShare: dto.fileShare,
      fileMasai: dto.fileMasai,
      fileOrigin: dto.fileOrigin ?? '0',
      originFlag: pickFlag(
        'origin',
        mode === 'private' ? '0' : '1',
        dto.originFlag,
      ),
      screenFlag: pickFlag('screen', '1', dto.screenFlag),
      iosFlag: dto.iosFlag ?? deviceBlockFlag,
      pcFlag: dto.pcFlag ?? deviceBlockFlag,
      shareBlockFlag,
      adFlag: pickFlag('ad', mode === 'private' ? '0' : '0', dto.adFlag),
      mode,
      activityId:
        shareBlockFlag === '1'
          ? await this.createWechatActivityId()
          : undefined,
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
    dto: {
      viewSec?: number;
      screenFlag?: string;
      screenType?: string;
      screenAt?: string;
      deviceInfo?: string;
    },
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
      screenType: dto.screenType,
      screenAt: dto.screenAt ? new Date(dto.screenAt) : undefined,
      deviceInfo: dto.deviceInfo,
    });
    const savedRecord = await this.recordRepo.save(record);
    return { canView: true, flash, recordId: savedRecord.id };
  }

  async updateViewRecord(
    recordId: string,
    userId: string,
    dto: {
      viewSec?: number;
      screenFlag?: string;
      screenType?: string;
      screenAt?: string;
      deviceInfo?: string;
    },
  ) {
    const record = await this.recordRepo.findOne({
      where: { id: recordId, userId, recordMode: In(['0', '1']) },
    });
    if (!record) throw new NotFoundException('查看记录不存在');
    if (dto.viewSec !== undefined) record.viewSec = dto.viewSec;
    if (dto.screenFlag !== undefined) record.screenFlag = dto.screenFlag;
    if (dto.screenType !== undefined) record.screenType = dto.screenType;
    if (dto.screenAt !== undefined) record.screenAt = new Date(dto.screenAt);
    if (dto.deviceInfo !== undefined) record.deviceInfo = dto.deviceInfo;
    await this.recordRepo.save(record);
    if (record.screenFlag === '1') {
      await this.applyCaptureBanIfNeeded(record.userId);
    }
    return { success: true };
  }

  private async applyCaptureBanIfNeeded(userId?: string | null) {
    if (!userId) return;
    const cfg = await this.configService.mget([
      'capture_ban_threshold',
      'capture_ban_days',
    ]);
    const threshold = Math.max(
      0,
      parseInt(cfg.capture_ban_threshold || '0', 10) || 0,
    );
    if (threshold <= 0) return;

    const captureCount = await this.recordRepo.count({
      where: {
        userId,
        screenFlag: '1',
        recordMode: In(['0', '1']),
      },
    });
    if (captureCount < threshold) return;

    const banDays = Math.max(1, parseInt(cfg.capture_ban_days || '7', 10) || 7);
    const now = new Date();
    const secureTime = new Date(now);
    secureTime.setDate(secureTime.getDate() + banDays);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user && !user.isBanned) {
      user.isBanned = true;
      await this.userRepo.save(user);
    }

    const existing = await this.userBanRepo.findOne({
      where: { userId, delFlag: '0' },
      order: { createdAt: 'DESC' },
    });
    const banReason = `累计截图/录屏 ${captureCount} 次，自动进入小黑屋`;
    if (existing) {
      existing.banDay = banDays;
      existing.banReason = banReason;
      existing.banAuthority = 2;
      existing.secureTime = secureTime;
      await this.userBanRepo.save(existing);
      return;
    }
    await this.userBanRepo.save(
      this.userBanRepo.create({
        userId,
        banDay: banDays,
        banReason,
        banAuthority: 2,
        createTime: now,
        secureTime,
      }),
    );
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
        iosFlag: true,
        pcFlag: true,
        shareBlockFlag: true,
        adFlag: true,
        mode: true,
        activityId: true,
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
    if (flash.adFlag !== '1') {
      throw new ForbiddenException('该闪图不允许广告解锁');
    }
    const maxAdUnlockCount = await this.configService.getNumber(
      'max_ad_unlock_count',
      3,
    );
    const adUnlocks = await this.recordRepo.count({
      where: { flashId, recordMode: '2' },
    });
    if (maxAdUnlockCount <= 0 || adUnlocks >= maxAdUnlockCount) {
      throw new ForbiddenException('广告解锁次数已达上限');
    }
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

  async getPrivateUploadAdStatus(userId: string) {
    const [required, dailyLimit] = await Promise.all([
      this.configService.getBool('private_upload_ad_required', true),
      this.configService.getNumber('private_daily_upload_ad_count', 3),
    ]);
    if (!required || dailyLimit <= 0) {
      return { required, dailyLimit, watched: 0, needAd: false };
    }
    const [start, end] = this.todayRange();
    const watched = await this.recordRepo.count({
      where: {
        userId,
        recordMode: '4',
        createdAt: Between(start, end),
      },
    });
    return {
      required,
      dailyLimit,
      watched,
      needAd: watched < dailyLimit,
    };
  }

  async recordPrivateUploadAd(userId: string) {
    const status = await this.getPrivateUploadAdStatus(userId);
    if (!status.required || !status.needAd) return { success: true, ...status };
    const record = this.recordRepo.create({
      flashId: 'private-upload-ad',
      userId,
      recordMode: '4',
      viewSec: 0,
      screenFlag: '0',
    });
    await this.recordRepo.save(record);
    return this.getPrivateUploadAdStatus(userId);
  }

  async recordShare(flashId: string, userId: string) {
    const flash = await this.flashRepo.findOne({
      where: { id: flashId, delFlag: '0', status: FlashStatus.PUBLISHED },
    });
    if (!flash) throw new NotFoundException('闪图不存在');
    if (flash.shareBlockFlag === '1' && flash.authorId !== userId) {
      throw new ForbiddenException('该闪照禁止转发');
    }
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

  private todayRange(): [Date, Date] {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(-1);
    return [start, end];
  }

  private async createWechatActivityId(): Promise<string | undefined> {
    try {
      const cfg = await this.configService.mget(['wx_appid', 'wx_secret']);
      const appid =
        cfg.wx_appid || this.envConfig.get<string>('WX_APPID') || '';
      const secret =
        cfg.wx_secret || this.envConfig.get<string>('WX_SECRET') || '';
      if (!appid || !secret) return undefined;

      const tokenRes = await axios.get<{
        access_token?: string;
        errcode?: number;
        errmsg?: string;
      }>('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
          grant_type: 'client_credential',
          appid,
          secret,
        },
        timeout: 5000,
      });
      const accessToken = tokenRes.data.access_token;
      if (!accessToken) return undefined;

      const activityRes = await axios.get<{
        activity_id?: string;
        errcode?: number;
        errmsg?: string;
      }>('https://api.weixin.qq.com/cgi-bin/message/wxopen/activityid/create', {
        params: { access_token: accessToken },
        timeout: 5000,
      });
      return activityRes.data.activity_id;
    } catch {
      return undefined;
    }
  }
}
