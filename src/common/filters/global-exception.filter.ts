// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).errors || null;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';

      // Handle specific database errors
      if (exception.message.includes('Duplicate entry')) {
        message = 'Resource already exists';
      } else if (exception.message.includes('foreign key constraint')) {
        message = 'Referenced resource not found';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Console log the error instead of using Nest Logger
    console.error(
      `[Error] ${request.method} ${request.url} - ${status} - ${message}`,
    );
    if (exception instanceof Error && exception.stack) {
      console.error(exception.stack);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(details && { details }),
    };

    response.status(status).json(errorResponse);
  }
}
