import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { UserBan } from '../entities/user-ban.entity';
import { SysConfigService } from '../config/config.service';

interface WxSession {
  openid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    @InjectRepository(UserBan) private userBanRepo: Repository<UserBan>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sysConfig: SysConfigService,
  ) {}

  async wxLogin(code: string) {
    const cfg = await this.sysConfig.mget(['wx_appid', 'wx_secret']);
    const appid =
      cfg['wx_appid'] || this.configService.get<string>('WX_APPID') || '';
    const secret =
      cfg['wx_secret'] || this.configService.get<string>('WX_SECRET') || '';
    if (!appid || !secret) {
      throw new UnauthorizedException(
        '微信登录未配置，请在后台系统配置中填写小程序 AppID 和 AppSecret',
      );
    }
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const { data } = await axios.get<WxSession>(url);
    if (data.errcode || !data.openid) {
      throw new UnauthorizedException('微信 code 无效');
    }

    let user = await this.userRepo.findOne({ where: { openid: data.openid } });
    if (!user) {
      user = this.userRepo.create({ openid: data.openid });
      await this.userRepo.save(user);
    }

    if (user.isBanned && (await this.isBanActive(user.id))) {
      throw new UnauthorizedException('账号已被封禁');
    }
    if (user.isBanned) {
      user.isBanned = false;
      await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({ sub: user.id, openid: user.openid });
    return { token, user };
  }

  private async isBanActive(userId: string) {
    const now = new Date();
    const active = await this.userBanRepo
      .createQueryBuilder('ban')
      .where('ban.userId = :userId', { userId })
      .andWhere('ban.delFlag = :delFlag', { delFlag: '0' })
      .andWhere('(ban.secureTime IS NULL OR ban.secureTime > :now)', { now })
      .getOne();
    return !!active;
  }

  async adminLogin(username: string, password: string) {
    const admin = await this.adminRepo.findOne({
      where: { username, isActive: true },
    });
    if (!admin) throw new UnauthorizedException('用户名或密码错误');

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) throw new UnauthorizedException('用户名或密码错误');

    const secret = this.configService.get<string>('ADMIN_JWT_SECRET') ?? '';
    const token = this.jwtService.sign(
      { sub: admin.id, username: admin.username, isAdmin: true },
      { secret, expiresIn: '8h' },
    );
    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
      },
    };
  }

  async updateProfile(
    userId: string,
    dto: { nickname?: string; avatarUrl?: string },
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.avatarUrl !== undefined) user.avatar = dto.avatarUrl;
    return this.userRepo.save(user);
  }

  async changeAdminPassword(
    adminId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    if (newPassword.length < 6) {
      throw new BadRequestException('新密码至少需要6位');
    }
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('管理员不存在');
    const valid = await bcrypt.compare(oldPassword, admin.password);
    if (!valid) throw new UnauthorizedException('原密码错误');
    admin.password = await bcrypt.hash(newPassword, 10);
    await this.adminRepo.save(admin);
    return { success: true };
  }

  async initAdminIfEmpty() {
    const count = await this.adminRepo.count();
    if (count === 0) {
      if (this.configService.get('AUTO_INSTALLED') === '1') {
        throw new Error('自动部署未成功写入管理员账号，已阻止后端继续启动');
      }
      const username = this.configService.get<string>('ADMIN_USER') ?? '';
      const password = this.configService.get<string>('ADMIN_PASSWORD') ?? '';
      if (!username || !password) {
        throw new Error(
          '数据库中没有管理员，请通过 ADMIN_USER 和 ADMIN_PASSWORD 环境变量配置初始管理员',
        );
      }
      const hash = await bcrypt.hash(password, 10);
      const admin = this.adminRepo.create({
        username,
        password: hash,
        nickname: '超级管理员',
      });
      await this.adminRepo.save(admin);
      console.log(`[Init] 已创建管理员 ${username}，请登录后立即修改密码！`);
    }
  }
}
