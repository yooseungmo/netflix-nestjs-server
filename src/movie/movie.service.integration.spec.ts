import { Cache, CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommonService } from '../common/common.service';
import { Director } from '../director/entities/director.entity';
import { Genre } from '../genre/entities/genre.entity';
import { User } from '../user/entities/user.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entities/movie-detail.entity';
import { MovieUserLike } from './entities/movie-user-like.entity';
import { Movie } from './entities/movie.entity';
import { MovieService } from './movie.service';

describe('MovieService - Integration Test', () => {
  let service: MovieService;
  let cacheManager: Cache;
  let dataSource: DataSource;

  let users: User[];
  let directors: Director[];
  let movies: Movie[];
  let genres: Genre[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [Movie, MovieDetail, Director, Genre, MovieUserLike, User],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre, MovieUserLike, User]),
      ],
      providers: [MovieService, CommonService],
    }).compile();

    service = module.get<MovieService>(MovieService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cacheManager.reset();

    const movieRepository = dataSource.getRepository(Movie);
    const movieDetailRepository = dataSource.getRepository(MovieDetail);
    const movieUserLikeRepository = dataSource.getRepository(MovieUserLike);
    const directorRepository = dataSource.getRepository(Director);
    const genreRepository = dataSource.getRepository(Genre);
    const userRepository = dataSource.getRepository(User);

    users = [1, 2].map((x) =>
      userRepository.create({
        id: x,
        email: `${x}@test.com`,
        password: `123123`,
      }),
    );

    await userRepository.save(users);

    directors = [1, 2].map((x) =>
      directorRepository.create({
        id: x,
        dob: new Date('1990-11-11'),
        nationality: 'South Korea',
        name: `Director Name ${x}`,
      }),
    );

    await directorRepository.save(directors);

    genres = [1, 2].map((x) =>
      genreRepository.create({
        id: x,
        name: `Genre ${x}`,
      }),
    );

    await genreRepository.save(genres);

    movies = [];
    for (let x = 1; x <= 15; x++) {
      movies.push(
        movieRepository.create({
          id: x,
          title: `Movie ${x}`,
          creator: users[0],
          genres: genres,
          likeCount: 0,
          dislikeCount: 0,
          detail: movieDetailRepository.create({
            detail: `Movie Detail ${x}`,
          }),
          movieFilePath: 'movies/movie1.mp4',
          director: directors[0],
          createdAt: new Date(`2023-9-${x}`),
        }),
      );
    }

    await movieRepository.save(movies);
  });

  describe('findRecent', () => {
    it('should return recent movies', async () => {
      const result = (await service.findRecent()) as Movie[];

      let sortedResult = [...movies];
      sortedResult.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      let sortedResultIds = sortedResult.slice(0, 10).map((x) => x.id);

      expect(result).toHaveLength(10);
      expect(result.map((x) => x.id)).toEqual(sortedResultIds);
    });

    it('should cache recent movies', async () => {
      const result = (await service.findRecent()) as Movie[];

      const cachedData = await cacheManager.get('MOVIE_RECENT');

      expect(cachedData).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('should return movies with correct titles', async () => {
      const dto = {
        title: 'Movie 15',
        order: ['createdAt_DESC'],
        take: 10,
      };

      const result = await service.findAll(dto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe(dto.title);
      expect(result.data[0]).not.toHaveProperty('likeStatus');
    });

    it('should return likeStatus if userId is provided', async () => {
      const dto = {
        order: ['createdAt_ASC'],
        take: 10,
      };

      const result = await service.findAll(dto, users[0].id);

      expect(result.data).toHaveLength(10);
      expect(result.data[0]).toHaveProperty('likeStatus');
    });
  });

  describe('findOne', () => {
    it('should return movie correctly', async () => {
      const movieId = movies[0].id;

      const result = await service.findOne(movieId);

      expect(result.id).toBe(movieId);
    });

    it('should return movie NotFoundException', async () => {
      await expect(service.findOne(12123123132123)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    // integration test에서도 모킹써도 상관없음
    beforeEach(() => {
      jest.spyOn(service, 'renameMovieFile').mockResolvedValue();
    });

    it('should create movie correctly', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'Test Movie',
        detail: 'A Test Movie Detail',
        directorId: directors[0].id,
        genreIds: genres.map((x) => x.id),
        movieFileName: 'test.mp4',
      };

      const result = await service.create(
        createMovieDto,
        users[0].id,
        dataSource.createQueryRunner(),
      );

      expect(result.title).toBe(createMovieDto.title);
      expect(result.director.id).toBe(createMovieDto.directorId);
      expect(result.genres.map((g) => g.id)).toEqual(genres.map((g) => g.id));
      expect(result.detail.detail).toBe(createMovieDto.detail);
    });
  });

  describe('update', () => {
    it('should update movie correctly', async () => {
      const movieId = movies[0].id;
      const updateMovieDto: UpdateMovieDto = {
        title: 'Changed Title',
        detail: 'Changed Detail',
        directorId: directors[1].id,
        genreIds: [genres[0].id],
      };

      const result = await service.update(movieId, updateMovieDto);

      expect(result.title).toBe(updateMovieDto.title);
      expect(result.detail.detail).toBe(updateMovieDto.detail);
      expect(result.director.id).toBe(updateMovieDto.directorId);
      expect(result.genres.map((x) => x.id)).toEqual(updateMovieDto.genreIds);
    });

    it('should throw error if movie does not exist', async () => {
      const updateMovieDto: UpdateMovieDto = {
        title: 'Changed Title',
      };

      await expect(service.update(23134124131, updateMovieDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove movie correctly', async () => {
      const removeId = movies[0].id;
      const result = await service.remove(removeId);

      expect(result).toBe(removeId);
    });

    it('should throw error if movie does not exist', async () => {
      await expect(service.remove(23134124131)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleMovieLike', () => {
    it('should create like correctly', async () => {
      const userId = users[0].id;
      const movieId = movies[0].id;

      const result = await service.toggleMovieLike(movieId, userId, true);

      expect(result).toEqual({ isLike: true });
    });

    it('should create dislike correctly', async () => {
      const userId = users[0].id;
      const movieId = movies[0].id;

      const result = await service.toggleMovieLike(movieId, userId, false);

      expect(result).toEqual({ isLike: false });
    });

    it('should create like correctly twice', async () => {
      const userId = users[0].id;
      const movieId = movies[0].id;

      await service.toggleMovieLike(movieId, userId, true);
      const result = await service.toggleMovieLike(movieId, userId, true);

      expect(result.isLike).toBeNull();
    });

    it('should create dislike correctly twice', async () => {
      const userId = users[0].id;
      const movieId = movies[0].id;

      await service.toggleMovieLike(movieId, userId, false);
      const result = await service.toggleMovieLike(movieId, userId, false);

      expect(result.isLike).toBeNull();
    });
  });
});
