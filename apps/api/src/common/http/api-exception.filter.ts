import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException ? exception.getResponse() : { message: 'Internal server error' };

    const message =
      typeof payload === 'string'
        ? payload
        : Array.isArray((payload as { message?: unknown }).message)
          ? (payload as { message: string[] }).message.join(', ')
          : (payload as { message?: string }).message ?? 'Unexpected error';

    if (!(exception instanceof HttpException) || status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('[Papipo API Error]', {
        path: request.url,
        status,
        exception
      });
    }

    response.status(status).json({
      error: {
        status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url
      }
    });
  }
}
