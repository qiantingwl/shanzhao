import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';
import { AdminJwtGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/guards/auth.guard';

class WxLoginDto {
  @IsString()
  code: string;
}

class AdminLoginDto {
  @IsString()
  userName: string;

  @IsString()
  password: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

class ChangeAdminPasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  newPassword: string;
}

interface MpRequest {
  user: { userId: string; openid: string };
}

interface AdminRequest extends Request {
  user: { adminId: string; username: string; isAdmin: boolean };
}

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('mp/auth/login')
  wxLogin(@Body() body: WxLoginDto) {
    return this.authService.wxLogin(body.code);
  }

  @Post('admin/auth/login')
  adminLogin(@Body() body: AdminLoginDto) {
    return this.authService.adminLogin(body.userName, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mp/user/profile')
  updateProfile(@Request() req: MpRequest, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Get('admin/auth/getUserInfo')
  getUserInfo(@Request() req: AdminRequest) {
    return {
      userId: req.user.adminId,
      userName: req.user.username,
      roles: ['R_SUPER'],
      buttons: [],
    };
  }

  @UseGuards(AdminJwtGuard)
  @Patch('admin/auth/password')
  changeAdminPassword(
    @Request() req: AdminRequest,
    @Body() body: ChangeAdminPasswordDto,
  ) {
    return this.authService.changeAdminPassword(
      req.user.adminId,
      body.oldPassword,
      body.newPassword,
    );
  }
}
