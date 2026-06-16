import { Body, Controller, Get, Post } from '@nestjs/common';
import { InstallService } from './install.service';

@Controller('api/install')
export class InstallController {
  constructor(private readonly installService: InstallService) {}

  @Get('status')
  getStatus() {
    return this.installService.getStatus();
  }

  @Post('submit')
  install(@Body() body: unknown) {
    return this.installService.install(
      body as Parameters<InstallService['install']>[0],
    );
  }

  @Post('test-db')
  testDb(@Body() body: unknown) {
    return this.installService.testDbConnection(
      body as Parameters<InstallService['testDbConnection']>[0],
    );
  }
}
