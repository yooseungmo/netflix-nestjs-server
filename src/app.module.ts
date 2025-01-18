import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entities/director.entity';
import { Genre } from './genre/entities/genre.entity';
import { GenreModule } from './genre/genre.module';
import { MovieDetail } from './movie/entities/movie-detail.entity';
import { Movie } from './movie/entities/movie.entity';
import { MovieModule } from './movie/movie.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 어떤 모듈에서든 글로벌하게 환경변수에 등록된거 사용가능
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
      }),
    }),
    // forRootAsync를 사용하는 이유는 위에 것들이 IoC컨테이너에서 생성된 인스턴스를 활용하기 위함
    // 동적으로 갖고 옴
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Movie, MovieDetail, Director, Genre],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    /** 
      synchronize: true, 
      이거 prod 에서는 절떄 true ㄴㄴ
      TypeORM 설정에 따라 데이터베이스 테이블과 컬럼이 자동으로 생성되거나 수정돼.
    */

    MovieModule,
    DirectorModule,
    GenreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
