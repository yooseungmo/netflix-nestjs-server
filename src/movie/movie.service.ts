import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
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
    if (!title) {
      return this.movieRepository.find({
        relations: ['detail', 'director'],
      });
    }
    return this.movieRepository.findAndCount({
      where: { title: Like(`${title}%`) },
      relations: ['detail'],
    });
  }

  async findOne(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director'],
    });
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

    const movie = await this.movieRepository.save({
      title: createMovieDto.title,
      detail: { detail: createMovieDto.detail },
      director,
      genres,
    });
    return movie;
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

    await this.movieRepository.update({ id }, movieUpdateFields);

    if (detail) {
      await this.movieDetailRepository.update(
        {
          id: movie.detail.id,
        },
        {
          detail,
        },
      );
    }

    const newMovie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director'],
    });

    newMovie.genres = newGenres;

    await this.movieRepository.save(newMovie);

    /**
     * return this.movieRepository.preload(newMovie);
     * .preload()
     * id를 기준으로 기존 엔티티를 찾아서 새로운 데이터로 업데이트한 후,
     * 엔티티 객체만 반환.
     * 저장은 하지 않음 !!!
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

    await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(id);
    return id;
  }
}
