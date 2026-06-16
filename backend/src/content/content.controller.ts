import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../common/guards/admin.guard';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('api/mp/help')
  getHelpList() {
    return this.contentService.getHelpList();
  }

  @Get('api/mp/user-ban')
  getBannedUsers(@Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    return this.contentService.getBannedUsers(+page, +pageSize);
  }

  @UseGuards(AdminJwtGuard)
  @Get('api/admin/help')
  getAdminHelpList(@Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    return this.contentService.getAdminHelpList(+page, +pageSize);
  }

  @UseGuards(AdminJwtGuard)
  @Post('api/admin/help')
  createHelp(
    @Body() dto: { feedName: string; feedCont: string; sort?: number },
  ) {
    return this.contentService.createHelp(dto);
  }

  @UseGuards(AdminJwtGuard)
  @Patch('api/admin/help/:id')
  updateHelp(
    @Param('id') id: string,
    @Body() dto: { feedName?: string; feedCont?: string; sort?: number },
  ) {
    return this.contentService.updateHelp(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete('api/admin/help/:id')
  deleteHelp(@Param('id') id: string) {
    return this.contentService.deleteHelp(id);
  }
}
