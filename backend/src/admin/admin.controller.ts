import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';
import { FlashStatus } from '../entities/flash.entity';
import { SysConfigService } from '../config/config.service';

@UseGuards(AdminJwtGuard)
@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly sysConfig: SysConfigService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('flash')
  getFlashList(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getFlashList({
      page: +page,
      pageSize: +pageSize,
      status,
      keyword,
    });
  }

  @Patch('flash/:id/status')
  updateFlashStatus(
    @Param('id') id: string,
    @Body('status') status: FlashStatus,
  ) {
    return this.adminService.updateFlashStatus(id, status);
  }

  @Delete('flash/:id')
  deleteFlash(@Param('id') id: string) {
    return this.adminService.deleteFlash(id);
  }

  @Get('flash/:id/records')
  getFlashRecords(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.adminService.getFlashRecords(id, +page, +pageSize);
  }

  @Get('user')
  getUserList(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getUserList({
      page: +page,
      pageSize: +pageSize,
      keyword,
    });
  }

  @Patch('user/:id/ban')
  banUser(@Param('id') id: string, @Body('banned') banned: boolean) {
    return this.adminService.banUser(id, banned);
  }

  @Get('config')
  getConfig() {
    return this.sysConfig.getAll();
  }

  @Patch('config/:key')
  setConfig(
    @Param('key') key: string,
    @Body('value') value: string,
    @Body('remark') remark?: string,
  ) {
    return this.sysConfig.set(key, value, remark);
  }

  @Patch('config')
  setConfigBatch(@Body() body: Record<string, string>) {
    const tasks = Object.entries(body).map(([key, value]) =>
      this.sysConfig.set(key, value),
    );
    return Promise.all(tasks);
  }
}
