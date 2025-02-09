import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { rename } from 'fs/promises';
import { join } from 'path';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { envVariableKeys } from '../common/const/env.const';
import { Director } from '../director/entities/director.entity';
import { Genre } from '../genre/entities/genre.entity';
import { User } from '../user/entities/user.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entities/movie-detail.entity';
import { MovieUserLike } from './entities/movie-user-like.entity';
import { Movie } from './entities/movie.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 모킹할때 한번에 묶어서 하기 위해서 분리
   * 테스트 하기 쉬운 코드 = 읽기 좋은 코드
   * */

  /* istanbul ignore next */
  async getMovies() {
    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    return this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.user', 'user')
      .leftJoinAndSelect('mul.movie', 'movie')
      .where('movie.id IN(:...movieIds)', { movieIds })
      .andWhere('user.id =:userId', { userId })
      .getMany();
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title } = dto;

    const qb = await this.getMovies();

    if (title) {
      qb.where('movie.title Like :title', { title: `%${title}%` });
    }

    const { nextCursor } = await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    let [data, count] = await qb.getManyAndCount();

    if (userId) {
      const movieIds = data.map((movie) => movie.id);

      /* istanbul ignore next */
      const likedMovies = movieIds.length < 1 ? [] : await this.getLikedMovies(movieIds, userId);

      const likeMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike,
        }),
        {},
      );

      data = data.map((x) => ({
        ...x,
        likeStatus: x.id in likeMovieMap ? likeMovieMap[x.id] : null,
      }));
    }

    return { data, nextCursor, count };
  }

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.movieRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });

    await this.cacheManager.set('MOVIE_RECENT', data, 3000);

    return data;
  }

  // 테스트 커버리지에서 제외시키는거
  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id = :id', { id })
      .getOne();
  }

  async findOne(id: number) {
    const movie = await this.findMovieDetail(id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    return movie;
  }

  /* istanbul ignore next */
  async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto) {
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();
  }

  /* istanbul ignore next */
  async createMovie(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
    director: Director,
    movieDetailId: number,
    userId: number,
    movieFolder: string,
  ) {
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into('movie')
      .values({
        title: createMovieDto.title,
        detail: {
          id: movieDetailId,
        },
        director,
        creator: {
          id: userId,
        },
        movieFilePath: join(movieFolder, createMovieDto.movieFileName),
      })
      .execute();
  }

  /* istanbul ignore next */
  async createMovieGenreRelation(qr: QueryRunner, movieId: number, genres: Genre[]) {
    return qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));
  }

  /* istanbul ignore next */
  renameMovieFile(tempFolder: string, movieFolder: string, createMovieDto: CreateMovieDto) {
    if (this.configService.get<string>(envVariableKeys.env) !== 'prod') {
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    } else {
      return this.commonService.saveMovieToPermanentStorage(createMovieDto.movieFileName);
    }
  }

  async create(createMovieDto: CreateMovieDto, userId: number, qr: QueryRunner) {
    const director = await qr.manager.findOne(Director, {
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 id의 감독입니당');
    }

    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있다잉, 없는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
      );
    }

    // Querybuilder는 cascade 옵션 안됨
    const movieDetail = await this.createMovieDetail(qr, createMovieDto);
    /**
      .identifiers 는 기본키 또는 id 반환
      [
        { id: 1 }, // 첫 번째 삽입된 행의 ID
        { id: 2 }, // 두 번째 삽입된 행의 ID
        ...
      ]
      */
    const movieDetailId = movieDetail.identifiers[0].id;

    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');

    const movie = await this.createMovie(
      qr,
      createMovieDto,
      director,
      movieDetailId,
      userId,
      movieFolder,
    );

    const movieId = movie.identifiers[0].id;

    // @ManyToMany 도 안됨, 따로 해줘야 함
    await this.createMovieGenreRelation(qr, movieId, genres);
    await this.renameMovieFile(tempFolder, movieFolder, createMovieDto);

    return await qr.manager.findOne(Movie, {
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  /* istanbul ignore next */
  async updateMovie(qr: QueryRunner, movieUpdateFields: UpdateMovieDto, id: number) {
    return qr.manager
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();
  }

  /* istanbul ignore next */
  async updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
    return qr.manager
      .createQueryBuilder()
      .update(MovieDetail)
      .set({
        detail,
      })
      .where('id =:id', { id: movie.detail.id })
      .execute();
  }

  /* istanbul ignore next */
  async updateMovieGenreRelation(qr: QueryRunner, id: number, newGenres: Genre[], movie: Movie) {
    return (
      qr.manager
        .createQueryBuilder()
        .relation(Movie, 'genres')
        .of(id)
        // 첫번째 파라미터 추가할거, 두번째 파라미터 삭제할거
        .addAndRemove(
          newGenres.map((genre) => genre.id),
          movie.genres.map((genre) => genre.id),
        )
    );
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: { id },
        relations: ['detail', 'genres'],
      });
      if (!movie) {
        throw new NotFoundException('이건 없다잉');
      }

      // 나머지 연산자(Rest Operator)는 반드시 맨 뒤에 사용해야 함
      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector;

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: {
            id: directorId,
          },
        });

        if (!director) {
          throw new NotFoundException('이건 감독이 없다잉');
        }

        newDirector = director;
      }

      let newGenres;

      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: {
            id: In(genreIds),
          },
        });

        if (genres.length !== updateMovieDto.genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있다잉, 없는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
          );
        }
        newGenres = genres;
      }

      // && : 참인경우는 뒤에꺼
      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      await this.updateMovie(qr, movieUpdateFields, id);

      if (detail) {
        await this.updateMovieDetail(qr, detail, movie);
      }

      if (newGenres) {
        await this.updateMovieGenreRelation(qr, id, newGenres, movie);
      }

      /**
       * .preload()
       * id를 기준으로 기존 엔티티를 찾아서 새로운 데이터로 업데이트한 후,
       * 엔티티 객체만 반환.
       * DB에 저장은 하지 않음 !!!
       */

      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: {
          id,
        },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  /* istanbul ignore next */
  async deleteMovie(id: number) {
    return this.movieRepository.createQueryBuilder().delete().where('id = :id', { id }).execute();
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException('이건 없다잉');
    }

    await this.deleteMovie(id);

    await this.movieDetailRepository.delete(id);
    return id;
  }

  /* istanbul ignore next */
  async getLikedRecord(movieId: number, userId: number) {
    return this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다.');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다');
    }

    const likeRecord = await this.getLikedRecord(movieId, userId);

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeRepository.delete({
          movie,
          user,
        });
      } else {
        await this.movieUserLikeRepository.update(
          {
            movie,
            user,
          },
          {
            isLike,
          },
        );
      }
    } else {
      await this.movieUserLikeRepository.save({ movie, user, isLike });
    }

    const result = await this.getLikedRecord(movieId, userId);

    return {
      isLike: result && result.isLike,
    };
  }
}
