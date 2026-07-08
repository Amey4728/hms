import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Structured request/response logging with duration. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const startedAt = process.hrtime.bigint();
    const { method, url } = req;

    return next.handle().pipe(
      tap(() => {
        const ms = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        this.logger.log(`${method} ${url} ${res.statusCode} ${ms.toFixed(1)}ms`);
      }),
    );
  }
}
