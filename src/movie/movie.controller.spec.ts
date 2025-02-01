import { TestBed } from '@automock/jest';
import { QueryRunner } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';

describe('MovieController', () => {
  let movieController: MovieController;
  let movieService: jest.Mocked<MovieService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(MovieController).compile();

    movieController = unit;
    movieService = unitRef.get<MovieService>(MovieService);
  });

  it('should be defined', () => {
    expect(movieController).toBeDefined();
  });

  describe('getMovies', () => {
    it('should call movieService.findAll with the correct parameters', async () => {
      const dto = { page: 1, limit: 10 };
      const userId = 1;
      const movies = [{ id: 1 }, { id: 2 }];

      jest.spyOn(movieService, 'findAll').mockResolvedValue(movies as any);

      const result = await movieController.getMovies(dto as any, userId);

      expect(movieService.findAll).toHaveBeenCalledWith(dto, userId);
      expect(result).toEqual(movies);
    });
  });

  describe('getMovie', () => {
    it('should call movieService.findOne with the correct id', async () => {
      const id = 1;
      const movie = { id: 1 };

      jest.spyOn(movieService, 'findOne').mockResolvedValue(movie as Movie);

      const result = await movieController.getMovie(id);

      expect(movieService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(movie);
    });
  });

  describe('postMovie', () => {
    it('should call movieService.create with the correct parameter', async () => {
      const userId = 1;
      const body = { title: 'blanc' };
      const movie = { id: 1 };
      const queryRunner = {};

      jest.spyOn(movieService, 'create').mockResolvedValue(movie as Movie);

      const result = await movieController.postMovie(
        body as CreateMovieDto,
        queryRunner as QueryRunner,
        userId,
      );

      expect(movieService.create).toHaveBeenCalledWith(body, userId, queryRunner);
      expect(result).toEqual(movie);
    });
  });

  describe('patchMovie', () => {
    it('should call movieService.patchMovie with the correct parameter', async () => {
      const id = 1;
      const body: UpdateMovieDto = { title: 'blanc' };
      const movie = { id: 1 };

      jest.spyOn(movieService, 'update').mockResolvedValue(movie as Movie);

      const result = await movieController.patchMovie(id, body);

      expect(movieService.update).toHaveBeenCalledWith(id, body);
      expect(result).toEqual(movie);
    });
  });

  describe('deleteMovie', () => {
    it('should call movieService.deleteMovie with the correct parameter', async () => {
      const id = 1;

      jest.spyOn(movieService, 'remove').mockResolvedValue(1);

      const result = await movieController.deleteMovie(id);

      expect(movieService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(1);
    });
  });

  describe('recent', () => {
    it('should call movieService.findRecent', async () => {
      const movies = [{ id: 1 }, { id: 2 }];

      jest.spyOn(movieService, 'findRecent').mockResolvedValue(movies);

      const result = await movieController.getMoviesRecent();

      expect(movieService.findRecent).toHaveBeenCalledWith();
      expect(result).toEqual(movies);
    });
  });

  describe('createMovieLike', () => {
    it('should call movieService.toggleMovieLike with the correct parameter', async () => {
      const movieId = 1;
      const userId = 2;
      const isLike = { isLike: true };

      jest.spyOn(movieService, 'toggleMovieLike').mockResolvedValue(isLike);

      const result = await movieController.createMovieLike(movieId, userId);

      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(movieId, userId, true);
      expect(result).toEqual(isLike);
    });
  });

  describe('createMovieDislike', () => {
    it('should call movieService.toggleMovieDislike with the correct parameter', async () => {
      const movieId = 1;
      const userId = 2;
      const isLike = { isLike: false };

      jest.spyOn(movieService, 'toggleMovieLike').mockResolvedValue(isLike);

      const result = await movieController.createMovieDislike(movieId, userId);

      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(movieId, userId, false);
      expect(result).toEqual(isLike);
    });
  });
});
