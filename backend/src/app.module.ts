import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { existsSync } from 'fs';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { FlashModule } from './flash/flash.module';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule as SysConfigModule } from './config/config.module';
import { User } from './entities/user.entity';
import { AdminUser } from './entities/admin-user.entity';
import { Flash } from './entities/flash.entity';
import { FlashRecord } from './entities/flash-record.entity';
import { SysConfig } from './entities/config.entity';
import { Help } from './entities/help.entity';
import { UserBan } from './entities/user-ban.entity';
import { ContentModule } from './content/content.module';
import { InstallModule } from './install/install.module';

const stateDir = process.env.INSTALL_STATE_DIR || process.cwd();
const installed =
  (existsSync(join(stateDir, '.env')) &&
    existsSync(join(stateDir, 'install.lock'))) ||
  (existsSync(join(process.cwd(), '.env')) &&
    existsSync(join(process.cwd(), 'install.lock')));

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InstallModule,
    ...(installed
      ? [
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (cfg: ConfigService) => ({
              type: 'mysql',
              host: cfg.get<string>('DB_HOST'),
              port: Number(cfg.get<string>('DB_PORT') ?? '3306'),
              username: cfg.get<string>('DB_USERNAME'),
              password: cfg.get<string>('DB_PASSWORD'),
              database: cfg.get<string>('DB_DATABASE'),
              entities: [
                User,
                AdminUser,
                Flash,
                FlashRecord,
                SysConfig,
                Help,
                UserBan,
              ],
              synchronize: cfg.get<string>('APP_ENV') !== 'production',
              charset: 'utf8mb4',
            }),
            inject: [ConfigService],
          }),
          ScheduleModule.forRoot(),
          AuthModule,
          FlashModule,
          UploadModule,
          AdminModule,
          SysConfigModule,
          ContentModule,
        ]
      : []),
  ],
})
export class AppModule {}
