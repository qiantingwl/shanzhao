import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createReadStream } from 'fs';
import FormData from 'form-data';

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

@Injectable()
export class WxSecurityService {
  private readonly logger = new Logger(WxSecurityService.name);
  private _atCache: AccessTokenCache | null = null;

  constructor(private configService: ConfigService) {}

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this._atCache && this._atCache.expiresAt > now + 60_000) {
      return this._atCache.token;
    }
    const appid = this.configService.get<string>('WX_APPID');
    const secret = this.configService.get<string>('WX_SECRET');
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const { data } = await axios.get<{
      access_token: string;
      expires_in: number;
    }>(url);
    this._atCache = {
      token: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };
    return this._atCache.token;
  }

  /**
   * 检测图片内容安全（微信 imgSecCheck 接口）
   * @param filePath  本地文件绝对路径
   * @param openid    用户 openid
   * @returns true = 安全，false = 违规
   */
  async checkImage(filePath: string, openid: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/wxa/img_sec_check?access_token=${token}`;
      const form = new FormData();
      form.append('media', createReadStream(filePath));
      form.append('openid', openid);
      form.append('version', '2');
      form.append('scene', '4');
      const { data } = await axios.post<{ errcode: number; errmsg: string }>(
        url,
        form,
        {
          headers: form.getHeaders(),
        },
      );
      if (data.errcode === 0 || data.errcode === undefined) return true;
      if (data.errcode === 87014) {
        this.logger.warn(`[imgSecCheck] 内容违规: ${filePath}`);
        return false;
      }
      this.logger.warn(`[imgSecCheck] errcode=${data.errcode} ${data.errmsg}`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[imgSecCheck] 检测异常: ${msg}`);
      return true;
    }
  }
}
