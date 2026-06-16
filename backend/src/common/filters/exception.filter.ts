import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttpException) {
      console.error('[UnhandledException]', exception);
    }

    const raw = isHttpException
      ? (exception.getResponse() as { message?: string } | string)
      : 'Internal server error';

    const msg =
      typeof raw === 'string' ? raw : (raw.message ?? 'Internal server error');

    const CODE_MAP: Record<number, string> = {
      401: '8888',
      403: '8889',
      404: '4040',
    };
    const code = CODE_MAP[status] ?? '5000';

    response.status(status).json({ code, data: null, msg });
  }
}
