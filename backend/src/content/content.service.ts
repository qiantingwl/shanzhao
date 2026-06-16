import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Help } from '../entities/help.entity';
import { UserBan } from '../entities/user-ban.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Help) private helpRepo: Repository<Help>,
    @InjectRepository(UserBan) private userBanRepo: Repository<UserBan>,
  ) {}

  async getHelpList() {
    const list = await this.helpRepo.find({
      where: { delFlag: '0' },
      order: { sort: 'ASC', createdAt: 'DESC' },
    });
    return list.map((item) => ({
      id: item.id,
      title: item.feedName,
      content: item.feedCont,
      sort: item.sort,
    }));
  }

  async getBannedUsers(page = 1, pageSize = 20) {
    const now = new Date();
    const [banList, banTotal] = await this.userBanRepo
      .createQueryBuilder('ban')
      .leftJoinAndSelect('ban.user', 'user')
      .where('ban.delFlag = :delFlag', { delFlag: '0' })
      .andWhere('(ban.secureTime IS NULL OR ban.secureTime > :now)', { now })
      .orderBy('ban.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return {
      list: banList.map((ban) => ({
        id: ban.id,
        userId: ban.userId,
        nickname: ban.user?.nickname || `用户${ban.userId.slice(-4)}`,
        avatar: ban.user?.avatar,
        banDay: ban.banDay,
        banReason: ban.banReason || '违规使用',
        banAuthority: ban.banAuthority,
        createTime: ban.createTime || ban.createdAt,
        secureTime: ban.secureTime,
        createdAt: ban.createdAt,
        updatedAt: ban.updatedAt,
      })),
      total: banTotal,
      page,
      pageSize,
    };
  }

  async getAdminHelpList(page = 1, pageSize = 20) {
    const [list, total] = await this.helpRepo.findAndCount({
      where: { delFlag: '0' },
      order: { sort: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  createHelp(dto: { feedName: string; feedCont: string; sort?: number }) {
    const help = this.helpRepo.create({
      feedName: dto.feedName,
      feedCont: dto.feedCont,
      sort: dto.sort ?? 0,
    });
    return this.helpRepo.save(help);
  }

  async updateHelp(
    id: string,
    dto: { feedName?: string; feedCont?: string; sort?: number },
  ) {
    const help = await this.helpRepo.findOne({ where: { id, delFlag: '0' } });
    if (!help) return null;
    if (dto.feedName !== undefined) help.feedName = dto.feedName;
    if (dto.feedCont !== undefined) help.feedCont = dto.feedCont;
    if (dto.sort !== undefined) help.sort = dto.sort;
    return this.helpRepo.save(help);
  }

  async deleteHelp(id: string) {
    const help = await this.helpRepo.findOne({ where: { id } });
    if (!help) return null;
    help.delFlag = '1';
    return this.helpRepo.save(help);
  }
}
