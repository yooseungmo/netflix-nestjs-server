import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/\bcommon.module';
import { Director } from '../director/entities/director.entity';
import { Genre } from '../genre/entities/genre.entity';
import { User } from '../user/entities/user.entity';
import { MovieDetail } from './entities/movie-detail.entity';
import { MovieUserLike } from './entities/movie-user-like.entity';
import { Movie } from './entities/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
      MovieUserLike,
      User,
    ]),
    CommonModule,
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
