import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Request logging
  app.use(morgan('dev'));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on port ${process.env.PORT ?? 3000}`);
}
void bootstrap();
