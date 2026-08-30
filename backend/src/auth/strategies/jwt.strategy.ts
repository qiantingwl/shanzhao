import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserBan } from '../../entities/user-ban.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserBan) private userBanRepo: Repository<UserBan>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  async validate(payload: { sub: string; openid: string }) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('账号已被封禁');
    }
    if (user.isBanned && (await this.isBanActive(user.id))) {
      throw new UnauthorizedException('账号已被封禁');
    }
    if (user.isBanned) {
      user.isBanned = false;
      await this.userRepo.save(user);
    }
    return { userId: payload.sub, openid: payload.openid };
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
}
