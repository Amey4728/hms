import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '@hms/shared';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { PaginatedResult } from '../dto/paginated-result';

/**
 * Wraps every successful controller return value in the standard success
 * envelope { success, message, data, meta }. Understands PaginatedResult.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse> {
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Success';

    return next.handle().pipe(
      map((payload): ApiResponse => {
        if (payload instanceof PaginatedResult) {
          return { success: true, message, data: payload.items, meta: payload.meta };
        }
        return {
          success: true,
          message,
          data: payload ?? null,
          meta: {},
        };
      }),
    );
  }
}
