import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import ImageauditClient, {
  ScanImageAdvanceRequest,
  ScanImageAdvanceRequestTask,
} from '@alicloud/imageaudit20191230';
import { $OpenApiUtil } from '@alicloud/openapi-core';
import { RuntimeOptions } from '@darabonba/typescript';
import { SysConfigService } from '../../config/config.service';

type AuditDriver = 'aliyun' | 'vxlink' | 'helloz' | 'nsfwpy' | 'disabled';

interface AuditResult {
  pass: boolean;
  reason?: string;
}

interface LocalAuditFile {
  path: string;
  filename: string;
  contentType?: string;
}

interface MultipartAuditOptions {
  baseUrl: string;
  endpoint: string;
  fileField: string;
  source: string;
  file: LocalAuditFile;
  headers?: Record<string, string>;
}

const ACTIVE_AUDIT_DRIVERS: AuditDriver[] = [
  'aliyun',
  'vxlink',
  'helloz',
  'nsfwpy',
];
const DEFAULT_NSFW_THRESHOLD = 0.8;
const DOWNLOAD_LIMIT = 12 * 1024 * 1024;

@Injectable()
export class ImageAuditService {
  private readonly logger = new Logger(ImageAuditService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly sysConfig: SysConfigService,
  ) {}

  private async val(sysKey: string, envKey: string): Promise<string> {
    const v = await this.sysConfig.get(sysKey);
    return v || (this.configService.get<string>(envKey) ?? '');
  }

  private async getDriver(): Promise<AuditDriver> {
    const enabled = await this.sysConfig.getBool('audit_enabled', false);
    if (!enabled) return 'disabled';

    const driver = (
      (await this.val('image_audit_driver', 'IMAGE_AUDIT_DRIVER')) || 'aliyun'
    ).toLowerCase() as AuditDriver;

    if (ACTIVE_AUDIT_DRIVERS.includes(driver)) {
      return driver;
    }
    throw new Error(`Unsupported image audit driver: ${driver}`);
  }

  async checkImageFile(
    localPath: string,
    file?: Pick<Express.Multer.File, 'originalname' | 'mimetype'>,
  ): Promise<AuditResult> {
    const driver = await this.getDriver();
    const auditFile: LocalAuditFile = {
      path: localPath,
      filename: file?.originalname || 'image.jpg',
      contentType: file?.mimetype,
    };

    switch (driver) {
      case 'aliyun':
        return this.checkByAliyunFile(auditFile);
      case 'vxlink':
        return this.checkByVxlinkFile(auditFile);
      case 'helloz':
        return this.checkByHellozFile(auditFile);
      case 'nsfwpy':
        return this.checkByNsfwpyFile(auditFile);
      case 'disabled':
        return { pass: true, reason: 'audit disabled' };
      default:
        throw new Error('Unsupported image audit driver');
    }
  }

  private async checkByAliyunFile(file: LocalAuditFile): Promise<AuditResult> {
    const [client, sceneValue] = await this.createAliyunClient();

    const response = await client.scanImageAdvance(
      new ScanImageAdvanceRequest({
        scene: this.parseScenes(sceneValue || 'porn,terrorism,ad,live'),
        task: [
          new ScanImageAdvanceRequestTask({
            dataId: `${Date.now()}`,
            imageURLObject: createReadStream(file.path),
          }),
        ],
      }),
      new RuntimeOptions({}),
    );

    return this.parseAliyunResponse(response, file.filename);
  }

  private async createAliyunClient(): Promise<[ImageauditClient, string]> {
    const [accessKeyId, accessKeySecret, regionId, sceneValue] =
      await Promise.all([
        this.val('image_audit_aliyun_access_key_id', 'ALIYUN_ACCESS_KEY_ID'),
        this.val(
          'image_audit_aliyun_access_key_secret',
          'ALIYUN_ACCESS_KEY_SECRET',
        ),
        this.val('image_audit_aliyun_region_id', 'ALIYUN_REGION_ID'),
        this.val('image_audit_aliyun_scenes', 'ALIYUN_IMAGE_AUDIT_SCENES'),
      ]);

    if (!accessKeyId || !accessKeySecret) {
      throw new Error('Aliyun image audit AccessKey is not configured');
    }

    const client = new ImageauditClient(
      new $OpenApiUtil.Config({
        accessKeyId,
        accessKeySecret,
        regionId: regionId || 'cn-shanghai',
      }),
    );

    return [client, sceneValue];
  }

  private parseAliyunResponse(
    response: Awaited<ReturnType<ImageauditClient['scanImage']>>,
    source: string,
  ): AuditResult {
    const subResults =
      response.body?.data?.results?.flatMap((item) => item.subResults ?? []) ??
      [];
    const blocked = subResults.find((item) => {
      const suggestion = (item.suggestion ?? '').toLowerCase();
      return suggestion === 'block' || suggestion === 'review';
    });

    if (!blocked) return { pass: true };

    const reason = [
      blocked.scene,
      blocked.label,
      blocked.suggestion,
      blocked.rate === undefined ? undefined : `rate=${blocked.rate}`,
    ]
      .filter(Boolean)
      .join(' ');

    this.logger.warn(`[AliyunImageAudit] blocked ${source} ${reason}`);
    return { pass: false, reason };
  }

  private async checkByVxlinkFile(file: LocalAuditFile): Promise<AuditResult> {
    const [baseUrl, thresholdValue] = await Promise.all([
      this.val('image_audit_vxlink_base_url', 'IMAGE_AUDIT_VXLINK_BASE_URL'),
      this.val('image_audit_vxlink_threshold', 'IMAGE_AUDIT_VXLINK_THRESHOLD'),
    ]);
    const response = await this.checkMultipartService({
      baseUrl,
      endpoint: '/check',
      fileField: 'file',
      source: 'vxlink',
      file,
    });

    const body = response.data as Record<string, any>;
    if (String(body?.status ?? '').toLowerCase() === 'error') {
      throw new Error(`vxlink NSFW check failed: ${body.message ?? 'unknown'}`);
    }

    return this.parseScoreResponse(
      body,
      'vxlink',
      this.parseThreshold(thresholdValue),
    );
  }

  private async checkByHellozFile(file: LocalAuditFile): Promise<AuditResult> {
    const [baseUrl, token, thresholdValue] = await Promise.all([
      this.val('image_audit_helloz_base_url', 'IMAGE_AUDIT_HELLOZ_BASE_URL'),
      this.val('image_audit_helloz_token', 'IMAGE_AUDIT_HELLOZ_TOKEN'),
      this.val('image_audit_helloz_threshold', 'IMAGE_AUDIT_HELLOZ_THRESHOLD'),
    ]);
    const response = await this.checkMultipartService({
      baseUrl,
      endpoint: '/api/upload_check',
      fileField: 'file',
      source: 'helloz',
      file,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const body = response.data as Record<string, any>;
    if (body?.code !== undefined && Number(body.code) !== 200) {
      throw new Error(
        `helloz NSFW check failed: ${body.msg ?? body.message ?? body.code}`,
      );
    }

    return this.parseScoreResponse(
      body,
      'helloz',
      this.parseThreshold(thresholdValue),
    );
  }

  private async checkByNsfwpyFile(file: LocalAuditFile): Promise<AuditResult> {
    const [baseUrl, thresholdValue] = await Promise.all([
      this.val('image_audit_nsfwpy_base_url', 'IMAGE_AUDIT_NSFWPY_BASE_URL'),
      this.val('image_audit_nsfwpy_threshold', 'IMAGE_AUDIT_NSFWPY_THRESHOLD'),
    ]);
    const response = await this.checkMultipartService({
      baseUrl,
      endpoint: '/classify',
      fileField: 'image',
      source: 'nsfwpy',
      file,
    });

    return this.parseScoreResponse(
      response.data,
      'nsfwpy',
      this.parseThreshold(thresholdValue),
    );
  }

  private async checkMultipartService(options: MultipartAuditOptions) {
    this.assertBaseUrl(options.baseUrl, options.source);
    return this.postMultipart(
      this.joinUrl(options.baseUrl, options.endpoint),
      options.fileField,
      options.file,
      options.headers,
    );
  }

  private async postMultipart(
    url: string,
    field: string,
    file: LocalAuditFile,
    headers?: Record<string, string>,
  ) {
    const form = new FormData();
    form.append(field, createReadStream(file.path), {
      filename: file.filename,
      contentType: file.contentType || undefined,
    });

    return axios.post<unknown>(url, form, {
      timeout: 30_000,
      headers: { ...form.getHeaders(), ...headers },
      maxContentLength: DOWNLOAD_LIMIT,
      maxBodyLength: DOWNLOAD_LIMIT,
    });
  }

  private parseScoreResponse(
    data: unknown,
    source: string,
    threshold: number,
  ): AuditResult {
    const isNsfw = this.findBooleanFlag(data, ['is_nsfw', 'nsfw']);
    if (isNsfw === true) return { pass: false, reason: `${source} is_nsfw` };

    const scores = new Map<string, number>();
    this.collectScores(data, scores);

    const nsfwpyTotal = ['porn', 'hentai', 'sexy']
      .map((key) => scores.get(key) ?? 0)
      .reduce((sum, value) => sum + value, 0);
    if (nsfwpyTotal >= threshold) {
      return {
        pass: false,
        reason: `${source} sexual=${nsfwpyTotal.toFixed(4)}`,
      };
    }

    const blocked = [
      'nsfw',
      'unsafe',
      'porn',
      'hentai',
      'sexy',
      'adult',
      'sexual',
      'explicit',
    ].find((key) => (scores.get(key) ?? 0) >= threshold);
    if (blocked) {
      return {
        pass: false,
        reason: `${source} ${blocked}=${(scores.get(blocked) ?? 0).toFixed(4)}`,
      };
    }

    return { pass: true };
  }

  private collectScores(data: unknown, scores: Map<string, number>): void {
    if (!data || typeof data !== 'object') return;
    if (Array.isArray(data)) {
      for (const item of data) this.collectScores(item, scores);
      return;
    }

    const body = data as Record<string, any>;
    const label = String(body.label ?? body.className ?? body.class ?? '')
      .trim()
      .toLowerCase();
    const labelScore = this.normalizeScore(
      body.score ?? body.probability ?? body.value,
    );
    if (label && labelScore !== undefined) scores.set(label, labelScore);

    for (const [key, value] of Object.entries(body)) {
      const normalizedKey = key.trim().toLowerCase();
      const score = this.normalizeScore(value);
      if (score !== undefined) scores.set(normalizedKey, score);
      if (value && typeof value === 'object') this.collectScores(value, scores);
    }
  }

  private findBooleanFlag(data: unknown, keys: string[]): boolean | undefined {
    if (!data || typeof data !== 'object') return undefined;
    if (Array.isArray(data)) {
      for (const item of data) {
        const value = this.findBooleanFlag(item, keys);
        if (value !== undefined) return value;
      }
      return undefined;
    }

    const body = data as Record<string, any>;
    for (const [key, value] of Object.entries(body)) {
      if (keys.includes(key.toLowerCase()) && typeof value === 'boolean') {
        return value;
      }
      if (value && typeof value === 'object') {
        const nested = this.findBooleanFlag(value, keys);
        if (nested !== undefined) return nested;
      }
    }
    return undefined;
  }

  private normalizeScore(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    if (value < 0) return undefined;
    if (value > 1 && value <= 100) return value / 100;
    if (value > 1) return undefined;
    return value;
  }

  private parseThreshold(value: string): number {
    const threshold = Number(value);
    if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
      return DEFAULT_NSFW_THRESHOLD;
    }
    return threshold;
  }

  private assertBaseUrl(baseUrl: string, source: string): void {
    if (!baseUrl) {
      throw new Error(`${source} NSFW service base URL is not configured`);
    }
  }

  private joinUrl(baseUrl: string, path: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  private parseScenes(value: string): string[] {
    const scenes = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return scenes.length ? scenes : ['porn', 'terrorism', 'ad', 'live'];
  }
}
