// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    console.log(
      `[Request] ${method} ${url} - IP: ${ip} - User Agent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const duration = Date.now() - startTime;

        console.log(
          `[Response] ${method} ${url} - Status: ${statusCode} - ${duration}ms`,
        );
      }),
    );
  }
}
