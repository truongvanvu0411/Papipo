import type { NextFunction, Request, Response } from 'express';

export function requestLoggingMiddleware(request: Request, response: Response, next: NextFunction) {
  const startedAt = Date.now();

  response.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(
      `[${request.method}] ${request.originalUrl} ${response.statusCode} ${duration}ms`
    );
  });

  next();
}
