import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
const stateDir = process.env.INSTALL_STATE_DIR || process.cwd();
dotenvConfig({ path: join(stateDir, '.env'), override: true });
dotenvConfig({ path: join(process.cwd(), '.env') });
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { TransformInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/exception.filter';
import * as express from 'express';
import type { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,x-request-id',
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const authService = app.get(AuthService);
  await authService.initAdminIfEmpty();

  app.use(
    express.static(join(process.cwd(), 'public', 'admin'), { index: false }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      next();
      return;
    }
    const adminIndex = join(process.cwd(), 'public', 'admin', 'index.html');
    if (existsSync(adminIndex)) {
      res.sendFile(adminIndex);
    } else {
      next();
    }
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[Server] running at http://localhost:${port}`);
}

void bootstrap();
