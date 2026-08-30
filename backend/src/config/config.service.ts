import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SysConfig } from '../entities/config.entity';

const DEFAULTS: Record<string, string> = {
  wx_appid: '',
  wx_secret: '',
  default_max_num: '1',
  default_max_sec: '3',
  default_flash_mode: 'entertainment',
  entertainment_origin_enabled: '1',
  entertainment_screen_enabled: '1',
  entertainment_device_block_enabled: '0',
  entertainment_share_block_enabled: '0',
  entertainment_ad_enabled: '1',
  private_origin_enabled: '0',
  private_screen_enabled: '1',
  private_device_block_enabled: '0',
  private_share_block_enabled: '1',
  private_ad_enabled: '0',
  private_upload_ad_required: '1',
  private_daily_upload_ad_count: '3',
  pc_view_block_when_screen_enabled: '1',
  capture_ban_threshold: '2',
  capture_ban_days: '7',
  ad_unlock_enabled: '1',
  max_ad_unlock_count: '3',
  ad_rewarded_video_id: '',
  ad_interstitial_id: '',
  ad_banner_id: '',
  audit_enabled: '0',
  image_audit_driver: 'aliyun',
  image_audit_aliyun_access_key_id: '',
  image_audit_aliyun_access_key_secret: '',
  image_audit_aliyun_region_id: 'cn-shanghai',
  image_audit_aliyun_scenes: 'porn,terrorism,ad,live',
  image_audit_vxlink_base_url: '',
  image_audit_vxlink_threshold: '0.8',
  image_audit_helloz_base_url: '',
  image_audit_helloz_token: '',
  image_audit_helloz_threshold: '0.8',
  image_audit_nsfwpy_base_url: '',
  image_audit_nsfwpy_threshold: '0.8',
  share_title: '对方发送了一张限时照片，点击查看',
  app_name: '闪照相机',
  app_slogan: '安全防破解，一键撤回，一键分享',
  app_version: 'v1.0.0',
  about_intro:
    '闪照相机用于创建限时查看图片，支持查看次数、查看时长、撤回、浏览记录等能力。',
  copyright_text: '免责声明：请勿上传违法违规内容，违规账号将被限制或封禁。',
  follow_desc: '关注公众号后可接收查看提醒、产品更新和客服通知。',
  follow_qrcode: '',
  follow_account: '闪照相机',
  service_time: '09:00 - 22:00',
  rules_text: '',
  privacy_text: '',
  retain_deleted_days: '30',
  retain_user_deleted: '1',
  storage_driver: '',
  storage_cos_secret_id: '',
  storage_cos_secret_key: '',
  storage_cos_bucket: '',
  storage_cos_region: 'ap-guangzhou',
  storage_cos_cdn: '',
  storage_oss_access_key_id: '',
  storage_oss_access_key_secret: '',
  storage_oss_bucket: '',
  storage_oss_region: 'oss-cn-hangzhou',
  storage_oss_cdn: '',
};

const DEFAULT_REMARKS: Record<string, string> = {
  wx_appid: '微信小程序 AppID，留空则读取环境变量 WX_APPID',
  wx_secret: '微信小程序 AppSecret，留空则读取环境变量 WX_SECRET',
  default_max_num: '默认最大查看次数',
  default_max_sec: '默认最大查看秒数',
  pc_view_block_when_screen_enabled:
    '开启后，开启防截屏的闪照在 PC 端不显示图片，仅提示使用手机查看',
  capture_ban_threshold:
    '用户累计截图/录屏达到多少次后自动进入小黑屋；0=关闭自动封禁',
  capture_ban_days: '自动进入小黑屋后的封禁天数',
  ad_unlock_enabled: '广告解锁开关：1=开启，0=关闭',
  ad_rewarded_video_id: '微信小程序激励视频广告位 ID',
  ad_interstitial_id: '微信小程序插屏广告位 ID',
  ad_banner_id: '微信小程序 Banner 广告位 ID',
  audit_enabled: '内容审核开关：1=使用所选审核接口，0=关闭审核直接通过',
  image_audit_driver: '图片审核接口：aliyun / vxlink / helloz / nsfwpy',
  image_audit_aliyun_access_key_id: '阿里云内容安全 AccessKeyId',
  image_audit_aliyun_access_key_secret: '阿里云内容安全 AccessKeySecret',
  image_audit_aliyun_region_id: '阿里云内容安全 RegionId，例如 cn-shanghai',
  image_audit_aliyun_scenes:
    '阿里云审核场景，逗号分隔，例如 porn,terrorism,ad,live,logo',
  image_audit_vxlink_base_url:
    'vxlink/nsfw_detector 服务地址，例如 http://127.0.0.1:3333；项目：https://github.com/tmplink/nsfw_detector',
  image_audit_vxlink_threshold: 'vxlink 拦截阈值，0-1，默认 0.8',
  image_audit_helloz_base_url:
    'helloz/nsfw 服务地址，例如 http://127.0.0.1:6086；项目：https://github.com/helloxz/nsfw',
  image_audit_helloz_token: 'helloz/nsfw Bearer Token，可选',
  image_audit_helloz_threshold: 'helloz 拦截阈值，0-1，默认 0.8',
  image_audit_nsfwpy_base_url:
    'nsfwpy 服务地址，例如 http://127.0.0.1:8000；项目：https://github.com/HG-ha/nsfwpy',
  image_audit_nsfwpy_threshold:
    'nsfwpy 拦截阈值，0-1，默认 0.8，会综合 porn/hentai/sexy 分数',
  share_title: '默认分享文案',
  app_name: '小程序名称',
  app_slogan: '小程序副标题',
  app_version: '版本号',
  about_intro: '关于我们页面的产品介绍',
  copyright_text: '关于我们页面底部免责声明',
  follow_desc: '关注我们页面说明文案',
  follow_qrcode: '公众号二维码图片 URL',
  follow_account: '公众号名称',
  service_time: '服务时间',
  rules_text: '自定义使用规范文本，留空则显示默认内容',
  privacy_text: '自定义隐私政策文本，留空则显示默认内容',
  retain_deleted_days: '删除内容保留天数',
  retain_user_deleted: '用户删除后是否保留文件：1=保留，0=清理文件',
  storage_driver:
    '存储驱动：local（本地）/ cos（腾讯云 COS）/ oss（阿里云 OSS），留空则读取环境变量',
  storage_cos_secret_id: '腾讯云 COS SecretId',
  storage_cos_secret_key: '腾讯云 COS SecretKey',
  storage_cos_bucket: '腾讯云 COS Bucket，包含 appId',
  storage_cos_region: '腾讯云 COS Region，例如 ap-guangzhou',
  storage_cos_cdn: '腾讯云 COS CDN 域名，可选，例如 https://cdn.example.com',
  storage_oss_access_key_id: '阿里云 OSS AccessKeyId',
  storage_oss_access_key_secret: '阿里云 OSS AccessKeySecret',
  storage_oss_bucket: '阿里云 OSS Bucket',
  storage_oss_region: '阿里云 OSS Region，例如 oss-cn-hangzhou',
  storage_oss_cdn: '阿里云 OSS CDN 域名，可选，例如 https://cdn.example.com',
};

@Injectable()
export class SysConfigService {
  private readonly _cache = new Map<
    string,
    { value: string; expiry: number }
  >();
  private readonly CACHE_TTL_MS = 60_000;

  constructor(
    @InjectRepository(SysConfig) private repo: Repository<SysConfig>,
  ) {}

  async get(key: string): Promise<string> {
    const cached = this._cache.get(key);
    if (cached && Date.now() < cached.expiry) return cached.value;
    const row = await this.repo.findOne({ where: { key } });
    const value = row?.value ?? DEFAULTS[key] ?? '';
    this._cache.set(key, { value, expiry: Date.now() + this.CACHE_TTL_MS });
    return value;
  }

  async mget(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const missing: string[] = [];
    for (const key of keys) {
      const cached = this._cache.get(key);
      if (cached && Date.now() < cached.expiry) {
        result[key] = cached.value;
      } else {
        missing.push(key);
      }
    }
    if (missing.length) {
      const rows = await this.repo.find({ where: { key: In(missing) } });
      const rowMap = new Map(rows.map((r) => [r.key, r.value]));
      for (const key of missing) {
        const value = rowMap.get(key) ?? DEFAULTS[key] ?? '';
        this._cache.set(key, { value, expiry: Date.now() + this.CACHE_TTL_MS });
        result[key] = value;
      }
    }
    return result;
  }

  async getAll(): Promise<SysConfig[]> {
    const rows = await this.repo.find({ order: { key: 'ASC' } });
    const map = new Map(rows.map((row) => [row.key, row]));
    const defaults = Object.entries(DEFAULTS).map(([key, value]) => {
      const row = map.get(key) ?? this.repo.create({ key, value });
      row.remark = DEFAULT_REMARKS[key] ?? row.remark ?? '';
      return row;
    });
    const extra = rows.filter((row) => !(row.key in DEFAULTS));
    return [...defaults, ...extra];
  }

  async getPublicConfig(): Promise<Record<string, string>> {
    const publicKeys = [
      'default_max_num',
      'default_max_sec',
      'default_flash_mode',
      'entertainment_origin_enabled',
      'entertainment_screen_enabled',
      'entertainment_device_block_enabled',
      'entertainment_share_block_enabled',
      'entertainment_ad_enabled',
      'private_origin_enabled',
      'private_screen_enabled',
      'private_device_block_enabled',
      'private_share_block_enabled',
      'private_ad_enabled',
      'private_upload_ad_required',
      'private_daily_upload_ad_count',
      'pc_view_block_when_screen_enabled',
      'capture_ban_threshold',
      'capture_ban_days',
      'ad_unlock_enabled',
      'max_ad_unlock_count',
      'ad_rewarded_video_id',
      'ad_interstitial_id',
      'ad_banner_id',
      'audit_enabled',
      'share_title',
      'app_name',
      'app_slogan',
      'app_version',
      'about_intro',
      'copyright_text',
      'follow_desc',
      'follow_qrcode',
      'follow_account',
      'service_time',
      'rules_text',
      'privacy_text',
    ];
    const rows = await this.repo.find({
      where: { key: In(publicKeys) },
    });
    const map: Record<string, string> = {};
    for (const key of publicKeys) {
      const row = rows.find((r) => r.key === key);
      map[key] = row?.value ?? DEFAULTS[key] ?? '';
    }
    return map;
  }

  async set(key: string, value: string, remark?: string): Promise<SysConfig> {
    let row = await this.repo.findOne({ where: { key } });
    if (row) {
      row.value = value;
      if (remark !== undefined) row.remark = remark;
    } else {
      row = this.repo.create({ key, value, remark });
    }
    const saved = await this.repo.save(row);
    this._cache.delete(key);
    return saved;
  }

  async getNumber(key: string, fallback = 0): Promise<number> {
    const v = await this.get(key);
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? fallback : n;
  }

  async getBool(key: string, fallback = false): Promise<boolean> {
    const v = await this.get(key);
    if (v === '') return fallback;
    return v === '1' || v === 'true';
  }
}
