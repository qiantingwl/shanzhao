import { Controller, Get } from '@nestjs/common';
import { SysConfigService } from './config.service';

@Controller('api/mp/config')
export class SysConfigController {
  constructor(private readonly sysConfig: SysConfigService) {}

  @Get()
  async getPublicConfig(): Promise<Record<string, string>> {
    return this.sysConfig.getPublicConfig();
  }
}
