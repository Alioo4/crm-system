import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/bad-request-exeption';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors: true});
  const logger = new Logger('bootstrap');
  const configService = app.get(ConfigService);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true}))

  const config = new DocumentBuilder()
    .setTitle('CRM System API')
    .setDescription(
      'This API is designed for managing customers, sales, products, and transactions within a CRM system. Includes authentication, user roles, and detailed analytics.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User login, registration, and token management')
    .addTag('Users', 'Manage CRM system users and roles')
    .addTag('Clients', 'Customer data management')
    .addTag('Products', 'Products and services offered')
    .addTag('Orders', 'Track customer purchases and sales history')
    .addTag('Analytics', 'Data insights and reports')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('APP_PORT') ?? 4001;
  await app.listen(port ?? 3000, '0.0.0.0');

  logger.log(`Application listening on port:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
