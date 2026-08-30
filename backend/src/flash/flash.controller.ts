import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { FlashService } from './flash.service';

interface ReqUser {
  userId: string;
  openid: string;
}
interface AuthRequest {
  user: ReqUser;
}

class CreateFlashDto {
  @IsString()
  filePath: string;

  @IsOptional()
  @IsString()
  fileThumb?: string;

  @IsOptional()
  @IsString()
  fileShare?: string;

  @IsOptional()
  @IsString()
  fileMasai?: string;

  @IsOptional()
  @IsString()
  fileOrigin?: string;

  @IsOptional()
  @IsString()
  originFlag?: string;

  @IsOptional()
  @IsString()
  screenFlag?: string;

  @IsOptional()
  @IsString()
  iosFlag?: string;

  @IsOptional()
  @IsString()
  pcFlag?: string;

  @IsOptional()
  @IsString()
  shareBlockFlag?: string;

  @IsOptional()
  @IsString()
  adFlag?: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsNumber()
  maxNum?: number;

  @IsOptional()
  @IsNumber()
  maxSec?: number;
}

class RecordViewDto {
  @IsOptional()
  @IsNumber()
  viewSec?: number;

  @IsOptional()
  @IsString()
  screenFlag?: string;

  @IsOptional()
  @IsString()
  screenType?: string;

  @IsOptional()
  @IsString()
  screenAt?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('api/mp/flash')
export class FlashController {
  constructor(private readonly flashService: FlashService) {}

  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateFlashDto) {
    return this.flashService.create(req.user.userId, dto);
  }

  @Get()
  getMyList(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.flashService.getMyList(req.user.userId, +page, +pageSize);
  }

  @Get('private-upload-ad/status')
  getPrivateUploadAdStatus(@Request() req: AuthRequest) {
    return this.flashService.getPrivateUploadAdStatus(req.user.userId);
  }

  @Post('private-upload-ad/record')
  recordPrivateUploadAd(@Request() req: AuthRequest) {
    return this.flashService.recordPrivateUploadAd(req.user.userId);
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.flashService.getDetail(id, req.user.userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.flashService.delete(id, req.user.userId);
  }

  @Patch(':id/revoke')
  revoke(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.flashService.revoke(id, req.user.userId);
  }

  @Get(':id/records')
  getViewRecords(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.flashService.getViewRecords(
      id,
      req.user.userId,
      +page,
      +pageSize,
    );
  }

  @Post(':id/view')
  recordView(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: RecordViewDto,
  ) {
    return this.flashService.recordView(id, req.user.userId, dto);
  }

  @Patch('record/:recordId')
  updateViewRecord(
    @Param('recordId') recordId: string,
    @Request() req: AuthRequest,
    @Body() dto: RecordViewDto,
  ) {
    return this.flashService.updateViewRecord(recordId, req.user.userId, dto);
  }

  @Get(':id/remain')
  getRemain(@Param('id') id: string) {
    return this.flashService.getRemain(id);
  }

  @Post(':id/ad-unlock')
  adUnlock(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.flashService.adUnlock(id, req.user.userId);
  }

  @Post(':id/share')
  recordShare(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.flashService.recordShare(id, req.user.userId);
  }
}
