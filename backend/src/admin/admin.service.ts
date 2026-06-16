import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, Like, Between, Not } from 'typeorm';
import { Flash, FlashStatus } from '../entities/flash.entity';
import { FlashRecord } from '../entities/flash-record.entity';
import { User } from '../entities/user.entity';
import { UserBan } from '../entities/user-ban.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Flash) private flashRepo: Repository<Flash>,
    @InjectRepository(FlashRecord) private recordRepo: Repository<FlashRecord>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserBan) private userBanRepo: Repository<UserBan>,
  ) {}

  async getFlashList(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }) {
    const { page = 1, pageSize = 20, status, keyword } = query;
    const where: FindOptionsWhere<Flash> = { delFlag: '0' };
    if (status) where.status = status as FlashStatus;

    const [list, total] = await this.flashRepo.findAndCount({
      where: keyword ? [{ ...where, authorId: Like(`%${keyword}%`) }] : where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: { author: true },
    });
    return { list, total, page, pageSize };
  }

  async updateFlashStatus(id: string, status: FlashStatus) {
    const flash = await this.flashRepo.findOne({ where: { id } });
    if (!flash) throw new NotFoundException('闪图不存在');
    flash.status = status;
    return this.flashRepo.save(flash);
  }

  async deleteFlash(id: string) {
    const flash = await this.flashRepo.findOne({ where: { id } });
    if (!flash) throw new NotFoundException('闪图不存在');
    flash.delFlag = '1';
    return this.flashRepo.save(flash);
  }

  async getFlashRecords(flashId: string, page = 1, pageSize = 20) {
    const [list, total] = await this.recordRepo.findAndCount({
      where: { flashId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: { user: true },
    });
    return { list, total };
  }

  async getUserList(query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }) {
    const { page = 1, pageSize = 20, keyword } = query;
    const [list, total] = await this.userRepo.findAndCount({
      where: keyword
        ? [{ nickname: Like(`%${keyword}%`) }, { openid: Like(`%${keyword}%`) }]
        : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async banUser(userId: string, banned: boolean) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    user.isBanned = banned;
    const saved = await this.userRepo.save(user);
    if (banned) {
      const now = new Date();
      const secureTime = new Date(now);
      secureTime.setFullYear(secureTime.getFullYear() + 10);
      const existing = await this.userBanRepo.findOne({
        where: { userId, delFlag: '0' },
        order: { createdAt: 'DESC' },
      });
      if (existing) {
        existing.banDay = 3650;
        existing.banReason = existing.banReason || '后台封禁';
        existing.banAuthority = 2;
        existing.secureTime = secureTime;
        await this.userBanRepo.save(existing);
      } else {
        await this.userBanRepo.save(
          this.userBanRepo.create({
            userId,
            banDay: 3650,
            banReason: '后台封禁',
            banAuthority: 2,
            createTime: now,
            secureTime,
          }),
        );
      }
    } else {
      const rows = await this.userBanRepo.find({
        where: { userId, delFlag: '0' },
      });
      for (const row of rows) {
        row.delFlag = '1';
      }
      if (rows.length) await this.userBanRepo.save(rows);
    }
    return saved;
  }

  async getDashboard() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const [
      totalFlash,
      totalUsers,
      totalRecords,
      pendingFlash,
      todayFlash,
      todayUsers,
      todayRecords,
      totalShares,
    ] = await Promise.all([
      this.flashRepo.count({ where: { delFlag: '0' } }),
      this.userRepo.count(),
      this.recordRepo.count({ where: { recordMode: Not('3') } }),
      this.flashRepo.count({
        where: { status: FlashStatus.PENDING, delFlag: '0' },
      }),
      this.flashRepo.count({
        where: { delFlag: '0', createdAt: Between(start, end) },
      }),
      this.userRepo.count({
        where: { createdAt: Between(start, end) },
      }),
      this.recordRepo.count({
        where: { createdAt: Between(start, end) },
      }),
      this.recordRepo.count({ where: { recordMode: '3' } }),
    ]);
    return {
      totalFlash,
      totalUsers,
      totalRecords,
      pendingFlash,
      todayFlash,
      todayUsers,
      todayRecords,
      totalShares,
    };
  }
}
