/**
 * main.ts - The Entry Point
 * ========================
 * This is where your NestJS app boots up. Think of it like the "ignition key" for your server.
 *
 * What happens here:
 * 1. NestFactory.create() builds the app from your root AppModule
 * 2. We configure global middleware (CORS, validation, response formatting)
 * 3. We set up Swagger for auto-generated API documentation
 * 4. We start listening on a port
 *
 * CORS (Cross-Origin Resource Sharing): Allows your Next.js frontend (running on
 * localhost:3001) to talk to this backend (running on localhost:5001).
 *
 * ValidationPipe: Automatically validates incoming request bodies against your DTOs.
 * If someone sends { name: 123 } but your DTO says @IsString(), NestJS will reject
 * it with a 400 error before your code even runs.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // -------------------------------------------------------------------
  // Global Prefix: All routes will start with /api/v1
  // e.g., /api/v1/auth/login, /api/v1/users/profile
  // This is cleaner than bare routes and lets you version your API later.
  // -------------------------------------------------------------------
  app.setGlobalPrefix('api/v1');

  // -------------------------------------------------------------------
  // CORS: Allow your frontend to make requests to this backend.
  // In production, you'd restrict 'origin' to your actual domain.
  // -------------------------------------------------------------------
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true, // true = allow all origins in dev
    credentials: true,
  });

  // -------------------------------------------------------------------
  // Global Validation Pipe
  // - whitelist: strips properties that DON'T have decorators in the DTO
  // - forbidNonWhitelisted: throws error if unknown properties are sent
  // - transform: auto-converts types (e.g., string "1" → number 1)
  // -------------------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // -------------------------------------------------------------------
  // Global Response Interceptor: Wraps ALL responses in a consistent format:
  // { meta: { statusCode, message, timestamp, path }, data: {...} }
  // This means your frontend always knows what shape to expect.
  // -------------------------------------------------------------------
  app.useGlobalInterceptors(new TransformInterceptor());

  // -------------------------------------------------------------------
  // Swagger: Auto-generates interactive API documentation from your
  // decorators (@ApiTags, @ApiOperation, @ApiResponse, etc.)
  // Visit http://localhost:5001/api-docs to see it.
  // -------------------------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('Comaket API')
    .setDescription(
      'API for Comaket - A multi-vendor marketplace where creators showcase and sell through stores',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication & authorization')
    .addTag('users', 'User management')
    .addTag('creators', 'Creator profiles & management')
    .addTag('stores', 'Store management')
    .addTag('listings', 'Product listings & the 3 selling types')
    .addTag('orders', 'Order processing & tracking')
    .addTag('categories', 'Product categories')
    .addTag('reviews', 'Ratings & reviews')
    .addTag('payments', 'Paystack payments & subscriptions')
    .addTag('admin', 'Admin panel operations')
    .addTag('notifications', 'In-app notifications')
    .addTag('media', 'File uploads')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
    },
  });

  // -------------------------------------------------------------------
  // Start the server
  // -------------------------------------------------------------------
  const port = process.env.PORT || 5001;
  await app.listen(port);

  Logger.log(
    `🚀 Comaket API running on: http://localhost:${port}`,
    'Bootstrap',
  );
  Logger.log(
    `📚 API Docs available at: http://localhost:${port}/api-docs`,
    'Bootstrap',
  );
}

bootstrap();
