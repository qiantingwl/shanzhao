import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import sharp from 'sharp';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ImageAuditService } from '../common/services/image-audit.service';
import { StorageService } from '../common/services/storage.service';

@UseGuards(JwtAuthGuard)
@Controller('api/mp/upload')
export class UploadController {
  constructor(
    private readonly imageAudit: ImageAuditService,
    private readonly storage: StorageService,
  ) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'images');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 9 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('只允许上传图片'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('未收到文件');

    const absPath = join(process.cwd(), 'uploads', 'images', file.filename);
    const thumbDir = join(process.cwd(), 'uploads', 'thumbs');
    if (!existsSync(thumbDir)) mkdirSync(thumbDir, { recursive: true });

    try {
      const auditResult = await this.imageAudit.checkImageFile(absPath, file);
      if (!auditResult.pass) {
        this.cleanupLocal(absPath);
        throw new BadRequestException('图片含有违规内容，上传失败');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.cleanupLocal(absPath);
      throw new BadRequestException('图片审核服务异常，请稍后重试');
    }

    const thumbFilename = `thumb_${file.filename}`;
    const thumbPath = join(thumbDir, thumbFilename);
    await sharp(absPath)
      .resize(400, 400, { fit: 'cover' })
      .blur(20)
      .jpeg({ quality: 70 })
      .toFile(thumbPath);

    const shareFilename = `share_${file.filename}`;
    const sharePath = join(thumbDir, shareFilename);
    await sharp(absPath)
      .resize(500, 400, { fit: 'cover' })
      .blur(20)
      .jpeg({ quality: 75 })
      .toFile(sharePath);

    let fileUrl = '';
    let thumbUrl = '';
    let shareUrl = '';
    try {
      fileUrl = await this.storage.upload(
        absPath,
        `uploads/images/${file.filename}`,
      );

      [thumbUrl, shareUrl] = await Promise.all([
        this.storage.upload(thumbPath, `uploads/thumbs/${thumbFilename}`),
        this.storage.upload(sharePath, `uploads/thumbs/${shareFilename}`),
      ]);

      return {
        filePath: fileUrl,
        fileThumb: thumbUrl,
        fileMasai: thumbUrl,
        fileShare: shareUrl,
        originalName: file.originalname,
        size: file.size,
      };
    } catch (err) {
      if (fileUrl) {
        await this.storage.remove(fileUrl);
      } else {
        this.cleanupLocal(absPath);
      }
      if (thumbUrl) await this.storage.remove(thumbUrl);
      if (shareUrl) await this.storage.remove(shareUrl);
      this.cleanupLocal(thumbPath, sharePath);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('图片审核服务异常，请稍后重试');
    }
  }

  private cleanupLocal(...paths: string[]): void {
    for (const path of paths) {
      try {
        if (existsSync(path)) unlinkSync(path);
      } catch {
        // ignore cleanup error
      }
    }
  }
}
