import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Director } from '../director/entities/director.entity';
import { Genre } from '../genre/entities/genre.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entities/movie-detail.entity';
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
  ) {}

  async findAll(title?: string) {
    const qb = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title Like :title', { title: `%${title}%` });
    }

    return await qb.getManyAndCount();

    /** Repository 방식 */
    // if (!title) {
    //   return this.movieRepository.find({
    //     relations: ['detail', 'director'],
    //   });
    // }
    // return this.movieRepository.findAndCount({
    //   where: { title: Like(`${title}%`) },
    //   relations: ['detail'],
    // });
  }

  async findOne(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();

    /** Repository 방식 */
    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director'],
    // });
    if (!movie) {
      throw new NotFoundException('이건 없다잉');
    }
    return movie;
  }

  async create(createMovieDto: CreateMovieDto) {
    const director = await this.directorRepository.findOne({
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 id의 감독입니당');
    }

    const genres = await this.genreRepository.find({
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
    const movieDetail = await this.movieDetailRepository
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();

    /**
    .identifiers 는 기본키 또는 id 반환
    [
      { id: 1 }, // 첫 번째 삽입된 행의 ID
      { id: 2 }, // 두 번째 삽입된 행의 ID
      ...
    ]
    */
    const movieDetailId = movieDetail.identifiers[0].id;

    const movie = await this.movieRepository
      .createQueryBuilder()
      .insert()
      .into('movie')
      .values({
        title: createMovieDto.title,
        detail: {
          id: movieDetailId,
        },
        director,
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    // @ManyToMany 도 안됨, 따로 해줘야 함
    await this.movieRepository
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));

    /** Repository 방식 */
    // const movie = await this.movieRepository.save({
    //   title: createMovieDto.title,
    //   detail: { detail: createMovieDto.detail },
    //   director,
    //   genres,
    // });
    return await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException('이건 없다잉');
    }

    // 나머지 연산자(Rest Operator)는 반드시 맨 뒤에 사용해야 함
    const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

    let newDirector;

    if (directorId) {
      const director = await this.directorRepository.findOne({
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
      const genres = await this.genreRepository.find({
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

    await this.movieRepository
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();

    /** Repository 방식 */
    // await this.movieRepository.update({ id }, movieUpdateFields);

    if (detail) {
      await this.movieDetailRepository
        .createQueryBuilder()
        .update(MovieDetail)
        .set({
          detail,
        })
        .where('id =:id', { id: movie.detail.id })
        .execute();

      /** Repository 방식 */
      // await this.movieDetailRepository.update(
      //   {
      //     id: movie.detail.id,
      //   },
      //   {
      //     detail,
      //   },
      // );
    }

    if (newGenres) {
      await this.movieRepository
        .createQueryBuilder()
        .relation(Movie, 'genres')
        .of(id)
        // 첫번째 파라미터 추가할거, 두번째 파라미터 삭제할거
        .addAndRemove(
          newGenres.map((genre) => genre.id),
          movie.genres.map((genre) => genre.id),
        );
    }

    /** Repository 방식 */
    // const newMovie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director'],
    // });

    // newMovie.genres = newGenres;

    // await this.movieRepository.save(newMovie);

    /**
     * return this.movieRepository.preload(newMovie);
     * .preload()
     * id를 기준으로 기존 엔티티를 찾아서 새로운 데이터로 업데이트한 후,
     * 엔티티 객체만 반환.
     * DB에 저장은 하지 않음 !!!
     */
    return this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException('이건 없다잉');
    }

    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();

    /** Repository 방식 */
    // await this.movieRepository.delete(id);

    await this.movieDetailRepository.delete(id);
    return id;
  }
}
