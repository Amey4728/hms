import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import type { ApiErrorDetail, ApiErrorResponse } from '@hms/shared';

/**
 * Converts every thrown error into the standard ApiErrorResponse envelope so
 * clients get a single, predictable error contract.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const { statusCode, code, message, details } = this.normalize(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode} ${code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      message,
      error: { code, statusCode, details },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId: request.id,
      },
    };

    response.status(statusCode).json(body);
  }

  private normalize(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  } {
    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      const details: ApiErrorDetail[] = zodError.issues.map((issue) => ({
        field: issue.path.join('.') || undefined,
        message: issue.message,
        code: issue.code,
      }));
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ?? exception.message);
      return {
        statusCode,
        code: this.codeFromStatus(statusCode),
        message: Array.isArray(message) ? message.join('; ') : message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaError(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };
  }

  private mapPrismaError(error: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  } {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[] | undefined)?.join(', ');
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT',
          message: `A record with this ${target ?? 'value'} already exists`,
        };
      }
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'The requested record was not found',
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: 'Related record constraint failed',
        };
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: `PRISMA_${error.code}`,
          message: 'Database request failed',
        };
    }
  }

  private codeFromStatus(status: number): string {
    return (HttpStatus[status] ?? (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR')).toString();
  }
}
