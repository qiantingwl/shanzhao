import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

interface InstallDto {
  dbHost: string;
  dbPort?: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  wxAppId: string;
  wxSecret: string;
  jwtSecret?: string;
  adminJwtSecret?: string;
  adminUsername: string;
  adminPassword: string;
  port?: number;
}

@Injectable()
export class InstallService {
  private readonly stateDir = process.env.INSTALL_STATE_DIR || process.cwd();
  private readonly lockPath = join(this.stateDir, 'install.lock');
  private readonly envPath = join(this.stateDir, '.env');
  private readonly legacyLockPath = join(process.cwd(), 'install.lock');
  private readonly legacyEnvPath = join(process.cwd(), '.env');

  isInstalled() {
    return (
      (existsSync(this.lockPath) && existsSync(this.envPath)) ||
      (existsSync(this.legacyLockPath) && existsSync(this.legacyEnvPath))
    );
  }

  getStatus() {
    return { installed: this.isInstalled() };
  }

  async testDbConnection(
    dto: Pick<
      InstallDto,
      'dbHost' | 'dbPort' | 'dbName' | 'dbUser' | 'dbPassword'
    >,
  ) {
    this.validateDb(dto);

    const connection = await this.createConnection(dto);
    try {
      await connection.query('SELECT 1');
      if (dto.dbName) {
        await connection.query(
          `CREATE DATABASE IF NOT EXISTS \`${this.escapeIdentifier(dto.dbName)}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
        );
      }
      return { success: true, message: '数据库连接成功' };
    } finally {
      await connection.end();
    }
  }

  async install(dto: InstallDto) {
    if (this.isInstalled()) {
      throw new BadRequestException('系统已安装，请勿重复安装');
    }

    this.validate(dto);

    const connection = await this.createConnection(dto);

    try {
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${this.escapeIdentifier(dto.dbName)}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
      );
      await connection.query(`USE \`${this.escapeIdentifier(dto.dbName)}\``);
      await this.createTables(connection);
      await this.createAdmin(connection, dto.adminUsername, dto.adminPassword);
      this.writeEnv(dto);
      setTimeout(() => process.exit(0), 1000);
      return {
        success: true,
        message: '安装成功，服务正在重启，请稍候...',
        adminUrl: '/',
      };
    } finally {
      await connection.end();
    }
  }

  private createConnection(
    dto: Pick<InstallDto, 'dbHost' | 'dbPort' | 'dbUser' | 'dbPassword'>,
  ) {
    return mysql.createConnection({
      host: dto.dbHost,
      port: Number(dto.dbPort || 3306),
      user: dto.dbUser,
      password: dto.dbPassword || '',
      multipleStatements: true,
    });
  }

  private validateDb(
    dto: Pick<
      InstallDto,
      'dbHost' | 'dbPort' | 'dbName' | 'dbUser' | 'dbPassword'
    >,
  ) {
    if (!dto.dbHost) throw new BadRequestException('请填写数据库地址');
    if (!dto.dbUser) throw new BadRequestException('请填写数据库账号');
    if (dto.dbName && !/^[A-Za-z0-9_-]+$/.test(dto.dbName)) {
      throw new BadRequestException(
        '数据库名只能包含字母、数字、下划线和中划线',
      );
    }
    const port = Number(dto.dbPort || 3306);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new BadRequestException('数据库端口不正确');
    }
  }

  private validate(dto: InstallDto) {
    const required: Array<keyof InstallDto> = [
      'dbHost',
      'dbName',
      'dbUser',
      'wxAppId',
      'wxSecret',
      'adminUsername',
      'adminPassword',
    ];
    for (const key of required) {
      if (!dto[key]) {
        throw new BadRequestException(`缺少参数：${key}`);
      }
    }
    this.validateDb(dto);
    if (dto.adminPassword.length < 6) {
      throw new BadRequestException('后台管理员密码至少需要 6 位');
    }
    if (dto.adminPassword.length > 64) {
      throw new BadRequestException('后台管理员密码不能超过 64 位');
    }
  }

  private writeEnv(dto: InstallDto) {
    mkdirSync(this.stateDir, { recursive: true });
    const jwtSecret = dto.jwtSecret || this.randomSecret('shan_mp');
    const adminJwtSecret =
      dto.adminJwtSecret || this.randomSecret('shan_admin');
    const port = dto.port || 3000;
    const content = [
      'APP_ENV=production',
      `PORT=${port}`,
      `DB_HOST=${this.envValue(dto.dbHost)}`,
      `DB_PORT=${Number(dto.dbPort || 3306)}`,
      `DB_USERNAME=${this.envValue(dto.dbUser)}`,
      `DB_PASSWORD=${this.envValue(dto.dbPassword || '')}`,
      `DB_DATABASE=${this.envValue(dto.dbName)}`,
      `WX_APPID=${this.envValue(dto.wxAppId)}`,
      `WX_SECRET=${this.envValue(dto.wxSecret)}`,
      `JWT_SECRET=${this.envValue(jwtSecret)}`,
      `ADMIN_JWT_SECRET=${this.envValue(adminJwtSecret)}`,
      'JWT_EXPIRES_IN=7d',
      'STORAGE_DRIVER=local',
      '',
    ].join('\n');

    writeFileSync(this.envPath, content, 'utf8');
    writeFileSync(this.lockPath, new Date().toISOString(), 'utf8');
  }

  private randomSecret(prefix: string) {
    return `${prefix}_${randomBytes(32).toString('hex')}`;
  }

  private escapeIdentifier(value: string) {
    return value.replace(/`/g, '``');
  }

  private envValue(value: string) {
    return JSON.stringify(value);
  }

  private async createTables(connection: mysql.Connection) {
    const initSqlPath = join(process.cwd(), 'sql', 'init.sql');
    const deploySqlPath = join(process.cwd(), 'deploy.sql');
    if (existsSync(initSqlPath)) {
      const sql = readFileSync(initSqlPath, 'utf8')
        .replace(/CREATE DATABASE IF NOT EXISTS `[^`]+`[^;]*;/g, '')
        .replace(/USE `[^`]+`;/g, '');
      await connection.query(sql);
    }
    if (existsSync(deploySqlPath)) {
      await connection.query(readFileSync(deploySqlPath, 'utf8'));
    }
    mkdirSync(join(process.cwd(), 'uploads', 'images'), { recursive: true });
  }

  private async createAdmin(
    connection: mysql.Connection,
    username: string,
    password: string,
  ) {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(1) AS cnt FROM admin_users WHERE username = ?',
      [username],
    );
    if (Number(rows[0]?.cnt || 0) > 0) return;
    const hash = await bcrypt.hash(password, 10);
    await connection.query(
      'INSERT INTO admin_users (id, username, password, nickname, isActive) VALUES (UUID(), ?, ?, ?, 1)',
      [username, hash, '超级管理员'],
    );
  }
}
