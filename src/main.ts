import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의되지 않은 값들은 전달되지 않게 할 수 있음
      forbidNonWhitelisted: true, // 정의되지 않는 값 들어오면 에러
    }),
  );
  await app.listen(3000);
}
bootstrap();
