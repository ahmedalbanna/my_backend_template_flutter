import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logs all incoming HTTP requests and their response status codes.
 *
 * Security-relevant events (4xx, 5xx) are logged at WARN or ERROR level,
 * while successful requests are logged at DEBUG-friendly VERBOSE level.
 * This interceptor provides an audit trail for all API access.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse<Response>();
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;

          const logMessage = `${method} ${url} ${statusCode} ${duration}ms - ${ip} - ${userAgent}`;

          if (statusCode >= 500) {
            this.logger.error(`${logMessage}`);
          } else if (statusCode >= 400) {
            this.logger.warn(`${logMessage}`);
          } else {
            this.logger.log(`${logMessage}`);
          }
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} 500 ${duration}ms - ${ip} - ${userAgent} - ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
