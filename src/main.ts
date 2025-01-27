import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['warn'] });

  const config = new DocumentBuilder()
    .setTitle('netflix-nestjs-server')
    .setDescription('netflix-nestjs-server')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      /** 새로고침 해도 인증 토큰 유지 */
      persistAuthorization: true,
    },
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의되지 않은 값들은 전달되지 않게 할 수 있음
      forbidNonWhitelisted: true, // 정의되지 않는 값 들어오면 에러
      transformOptions: {
        enableImplicitConversion: true, // 요청 데이터의 타입을 DTO에서 정의한 타입으로 자동 변환
      },
    }),
  );
  await app.listen(3000);
}
bootstrap();
