/* eslint-disable @typescript-eslint/no-require-imports */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { basename, join } from 'path';
import { SysConfigService } from '../../config/config.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private cfg: ConfigService,
    private sysConfig: SysConfigService,
  ) {}

  private async getDriver(): Promise<string> {
    const v = await this.sysConfig.get('storage_driver');
    return (v || this.cfg.get<string>('STORAGE_DRIVER') || 'local').toLowerCase();
  }

  private async val(sysKey: string, envKey: string): Promise<string> {
    const v = await this.sysConfig.get(sysKey);
    return v || (this.cfg.get<string>(envKey) ?? '');
  }

  async upload(localPath: string, destKey: string): Promise<string> {
    const driver = await this.getDriver();
    try {
      switch (driver) {
        case 'cos':
          return await this.uploadCos(localPath, destKey);
        case 'oss':
          return await this.uploadOss(localPath, destKey);
        default:
          return `/${destKey}`;
      }
    } finally {
      if (driver !== 'local') {
        this.removeLocalPath(localPath);
      }
    }
  }

  private async uploadCos(localPath: string, key: string): Promise<string> {
    const COS = require('cos-nodejs-sdk-v5') as new (opts: object) => {
      putObject: (
        params: object,
        cb: (err: Error | null, data: { Location: string }) => void,
      ) => void;
    };
    const secretId = await this.val('storage_cos_secret_id', 'COS_SECRET_ID');
    const secretKey = await this.val(
      'storage_cos_secret_key',
      'COS_SECRET_KEY',
    );
    const bucket = await this.val('storage_cos_bucket', 'COS_BUCKET');
    const region = await this.val('storage_cos_region', 'COS_REGION');
    const cdn = await this.val('storage_cos_cdn', 'COS_CDN');

    const cos = new COS({ SecretId: secretId, SecretKey: secretKey });
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: bucket,
          Region: region,
          Key: key,
          Body: createReadStream(localPath),
        },
        (err, data) => {
          if (err) return reject(err);
          resolve(cdn ? this.joinPublicUrl(cdn, key) : `https://${data.Location}`);
        },
      );
    });
  }

  private async uploadOss(localPath: string, key: string): Promise<string> {
    const OSS = require('ali-oss') as new (opts: object) => {
      put: (key: string, path: string) => Promise<{ url: string }>;
    };
    const client = new OSS({
      region: await this.val('storage_oss_region', 'OSS_REGION'),
      accessKeyId: await this.val(
        'storage_oss_access_key_id',
        'OSS_ACCESS_KEY_ID',
      ),
      accessKeySecret: await this.val(
        'storage_oss_access_key_secret',
        'OSS_ACCESS_KEY_SECRET',
      ),
      bucket: await this.val('storage_oss_bucket', 'OSS_BUCKET'),
    });
    const cdn = await this.val('storage_oss_cdn', 'OSS_CDN');
    const result = await client.put(key, localPath);
    return cdn ? this.joinPublicUrl(cdn, key) : result.url;
  }

  async remove(fileUrl: string): Promise<void> {
    const driver = await this.getDriver();
    const key = this.extractObjectKey(fileUrl);

    try {
      switch (driver) {
        case 'cos':
          await this.removeCos(key);
          break;
        case 'oss':
          await this.removeOss(key);
          break;
        default:
          this.removeLocalPath(join(process.cwd(), key));
      }
    } catch (e: unknown) {
      this.logger.warn(`[StorageService.remove] ${String(e)}`);
    }
  }

  private async removeCos(key: string): Promise<void> {
    const COS = require('cos-nodejs-sdk-v5') as new (opts: object) => {
      deleteObject: (
        params: object,
        cb: (err: Error | null) => void,
      ) => void;
    };
    const [cosId, cosKey, cosBucket, cosRegion] = await Promise.all([
      this.val('storage_cos_secret_id', 'COS_SECRET_ID'),
      this.val('storage_cos_secret_key', 'COS_SECRET_KEY'),
      this.val('storage_cos_bucket', 'COS_BUCKET'),
      this.val('storage_cos_region', 'COS_REGION'),
    ]);
    const cos = new COS({ SecretId: cosId, SecretKey: cosKey });
    await new Promise<void>((res, rej) =>
      cos.deleteObject(
        { Bucket: cosBucket, Region: cosRegion, Key: key },
        (err) => (err ? rej(err) : res()),
      ),
    );
  }

  private async removeOss(key: string): Promise<void> {
    const OSS = require('ali-oss') as new (opts: object) => {
      delete: (key: string) => Promise<void>;
    };
    const client = new OSS({
      region: await this.val('storage_oss_region', 'OSS_REGION'),
      accessKeyId: await this.val(
        'storage_oss_access_key_id',
        'OSS_ACCESS_KEY_ID',
      ),
      accessKeySecret: await this.val(
        'storage_oss_access_key_secret',
        'OSS_ACCESS_KEY_SECRET',
      ),
      bucket: await this.val('storage_oss_bucket', 'OSS_BUCKET'),
    });
    await client.delete(key);
  }

  private extractObjectKey(fileUrl: string): string {
    if (fileUrl.startsWith('http')) {
      try {
        return new URL(fileUrl).pathname.replace(/^\/+/, '');
      } catch {
        return basename(fileUrl);
      }
    }
    return fileUrl.replace(/^\/+/, '');
  }

  private joinPublicUrl(baseUrl: string, key: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
  }

  private removeLocalPath(path: string): void {
    try {
      if (existsSync(path)) unlinkSync(path);
    } catch {
      // ignore
    }
  }
}
