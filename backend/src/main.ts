import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
const stateDir = process.env.INSTALL_STATE_DIR || process.cwd();
dotenvConfig({ path: join(stateDir, '.env'), override: true });
dotenvConfig({ path: join(process.cwd(), '.env') });
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as express from 'express';

function printAutoInstallInfo() {
  const infoPath = join(stateDir, 'auto-install-info.txt');
  if (existsSync(infoPath)) {
    console.log('\n========== Auto Deployment Info ==========');
    console.log(readFileSync(infoPath, 'utf8').trim());
    console.log('==========================================\n');
  }
}

function isInstalled(): boolean {
  const runtimeInstalled =
    existsSync(join(stateDir, '.env')) &&
    existsSync(join(stateDir, 'install.lock'));
  const legacyInstalled =
    existsSync(join(process.cwd(), '.env')) &&
    existsSync(join(process.cwd(), 'install.lock'));
  return runtimeInstalled || legacyInstalled;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,x-request-id,apifoxtoken',
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.use('/install', express.static(join(process.cwd(), 'public', 'install')));

  if (isInstalled()) {
    printAutoInstallInfo();
    const authService = app.get(AuthService);
    await authService.initAdminIfEmpty();

    app.use(
      express.static(join(process.cwd(), 'public', 'admin'), { index: false }),
    );
    app.use((req, res, next) => {
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
  } else {
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const installHtml = join(
        process.cwd(),
        'public',
        'install',
        'index.html',
      );
      if (existsSync(installHtml)) {
        res.sendFile(installHtml);
      } else {
        res.status(503).json({ msg: 'Install page not found' });
      }
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[Server] running at http://localhost:${port}`);
}

void bootstrap();
