"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Comaket API')
        .setDescription('API for Comaket - A multi-vendor marketplace where creators showcase and sell through stores')
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
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
    }, 'JWT-auth')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api-docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
            docExpansion: 'none',
            filter: true,
        },
    });
    const port = process.env.PORT || 5000;
    await app.listen(port);
    common_1.Logger.log(`🚀 Comaket API running on: http://localhost:${port}`, 'Bootstrap');
    common_1.Logger.log(`📚 API Docs available at: http://localhost:${port}/api-docs`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map