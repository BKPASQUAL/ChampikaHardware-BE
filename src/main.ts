// src/main.ts - Enhanced version
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert string numbers to numbers
      },
      errorHttpStatusCode: 422, // Use 422 for validation errors
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
          return {
            field: error.property,
            errors: constraints,
            value: error.value,
          };
        });

        return new BadRequestException({
          message: 'Validation failed',
          errors: messages,
        });
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enhanced CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Security headers
  app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
