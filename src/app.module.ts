import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { WinstonModule } from 'nest-winston';
import { join } from 'path';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './auth/\bguard/auth.guard';
import { RBACGuard } from './auth/\bguard/rbac.guard';
import { AuthModule } from './auth/auth.module';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { envVariableKeys } from './common/const/env.const';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceptor';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entities/director.entity';
import { Genre } from './genre/entities/genre.entity';
import { GenreModule } from './genre/genre.module';
import { MovieDetail } from './movie/entities/movie-detail.entity';
import { MovieUserLike } from './movie/entities/movie-user-like.entity';
import { Movie } from './movie/entities/movie.entity';
import { MovieModule } from './movie/movie.module';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 어떤 모듈에서든 글로벌하게 환경변수에 등록된거 사용가능
      envFilePath: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
      validationSchema: Joi.object({
        ENV: Joi.string().valid('test', 'dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUND: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    // forRootAsync를 사용하는 이유는 위에 것들이 IoC컨테이너에서 생성된 인스턴스를 활용하기 위함
    // 동적으로 갖고 옴
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariableKeys.dbType) as 'postgres',
        host: configService.get<string>(envVariableKeys.dbHost),
        port: configService.get<number>(envVariableKeys.dbPort),
        username: configService.get<string>(envVariableKeys.dbUsername),
        password: configService.get<string>(envVariableKeys.dbPassword),
        database: configService.get<string>(envVariableKeys.dbDatabase),
        entities: [Movie, MovieDetail, Director, Genre, User, MovieUserLike],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    /** 
      synchronize: true, 
      이거 prod 에서는 절떄 true ㄴㄴ
      TypeORM 설정에 따라 데이터베이스 테이블과 컬럼이 자동으로 생성되거나 수정돼.
    */
    ServeStaticModule.forRoot({
      // 여기서 찾아라
      rootPath: join(process.cwd(), 'public'),
      // 이걸로 시작하는 path여야 됨
      serveRoot: '/public/',
    }),
    CacheModule.register({
      ttl: 3000,
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({
              all: true,
            }),
            winston.format.timestamp(),
            winston.format.printf(
              (info) => `${info.timestamp} [${info.context}] ${info.level} ${info.message}`,
            ),
          ),
        }),
        new winston.transports.File({
          dirname: join(process.cwd(), 'logs'),
          filename: 'logs.log',
          format: winston.format.combine(
            // winston.format.colorize({
            //   all: true,
            // }),
            winston.format.timestamp(),
            winston.format.printf(
              (info) => `${info.timestamp} [${info.context}] ${info.level} ${info.message}`,
            ),
          ),
        }),
      ],
    }),
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      /** 앱 전체에 Guard 적용 */
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RBACGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    // {
    //   provide: APP_FILTER,
    //   useClass: ForbiddenExceptionFilter,
    // },
    {
      provide: APP_FILTER,
      useClass: QueryFailedExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottleInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleware)
      // 이 두개 라우터는 Basic 토큰 사용해서 제외시킴
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
