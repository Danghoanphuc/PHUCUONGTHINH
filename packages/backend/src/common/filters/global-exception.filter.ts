import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../dto/api-response.dto';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;

    let status: number;
    let code: string;
    let message: string;
    let details: any;

    if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.getErrorCodeFromStatus(status);
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        code =
          (exceptionResponse as any).error ||
          this.getErrorCodeFromStatus(status);
        details = (exceptionResponse as any).details;
      } else {
        message = exception.message;
        code = this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Handle Prisma database errors
      status = HttpStatus.BAD_REQUEST;
      const prismaError = this.handlePrismaError(exception);
      code = prismaError.code;
      message = prismaError.message;
      details = prismaError.details;
    } else if (exception instanceof PrismaClientValidationError) {
      // Handle Prisma validation errors
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'Invalid data provided';
      details = (exception as Error).message;
    } else if (exception instanceof Error) {
      // Handle generic errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected error occurred';
      details =
        process.env.NODE_ENV === 'development' ? exception.message : undefined;
    } else {
      // Handle unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'UNKNOWN_ERROR';
      message = 'An unknown error occurred';
    }

    // Skip logging for common 404s (root path, favicon, etc.)
    const isRouteMissing =
      exception instanceof NotFoundException &&
      (path === '/' || path === '/favicon.ico');

    if (!isRouteMissing) {
      this.logger.error(
        `${request.method} ${path} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp,
        path,
      },
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_FAILED';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      default:
        return 'HTTP_ERROR';
    }
  }

  private handlePrismaError(exception: PrismaClientKnownRequestError): {
    code: string;
    message: string;
    details?: any;
  } {
    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        const target = exception.meta?.target as string[];
        const field = target && target.length > 0 ? target[0] : 'field';
        return {
          code: 'DUPLICATE_VALUE',
          message: `A record with this ${field} already exists`,
          details: { field, constraint: 'unique' },
        };
      case 'P2025':
        // Record not found
        const cause = exception.meta?.cause as string;
        return {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found',
          details: { operation: cause || 'unknown' },
        };
      case 'P2003':
        // Foreign key constraint violation
        const fieldName = exception.meta?.field_name as string;
        return {
          code: 'CONSTRAINT_VIOLATION',
          message: 'Referenced resource does not exist',
          details: { field: fieldName || 'unknown' },
        };
      case 'P2014':
        // Required relation violation
        const relationName = exception.meta?.relation_name as string;
        return {
          code: 'REQUIRED_RELATION_VIOLATION',
          message: 'The change would violate a required relation',
          details: { relation: relationName || 'unknown' },
        };
      case 'P2000':
        // Value too long
        const columnName = exception.meta?.column_name as string;
        return {
          code: 'VALUE_TOO_LONG',
          message: 'The provided value is too long for the database column',
          details: { column: columnName || 'unknown' },
        };
      case 'P2001':
        // Record does not exist
        const whereClause = exception.meta?.where;
        return {
          code: 'RECORD_NOT_FOUND',
          message: 'The record does not exist',
          details: { where: whereClause || 'unknown' },
        };
      default:
        return {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          details: { prismaCode: exception.code },
        };
    }
  }
}
