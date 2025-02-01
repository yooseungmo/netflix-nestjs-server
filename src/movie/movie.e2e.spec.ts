import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Director } from '../director/entities/director.entity';
import { Genre } from '../genre/entities/genre.entity';
import { Role, User } from '../user/entities/user.entity';
import { MovieDetail } from './entities/movie-detail.entity';
import { MovieUserLike } from './entities/movie-user-like.entity';
import { Movie } from './entities/movie.entity';

describe('MovieController (e2e)', () => {
  let app: INestApplication;
  let users: User[];
  let directors: Director[];
  let movies: Movie[];
  let genres: Genre[];
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    /** main.ts에 있는 파이프 적용 시켜줘야함 */
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // 정의되지 않은 값들은 전달되지 않게 할 수 있음
        forbidNonWhitelisted: true, // 정의되지 않는 값 들어오면 에러
        transformOptions: {
          enableImplicitConversion: true, // 요청 데이터의 타입을 DTO에서 정의한 타입으로 자동 변환
        },
      }),
    );
    await app.init();

    dataSource = app.get<DataSource>(DataSource);

    const movieRepository = dataSource.getRepository(Movie);
    const movieDetailRepository = dataSource.getRepository(MovieDetail);
    const movieUserLikeRepository = dataSource.getRepository(MovieUserLike);
    const directorRepository = dataSource.getRepository(Director);
    const genreRepository = dataSource.getRepository(Genre);
    const userRepository = dataSource.getRepository(User);

    await movieUserLikeRepository.delete({});
    await movieRepository.delete({});
    await movieDetailRepository.delete({});
    await directorRepository.delete({});
    await genreRepository.delete({});
    await userRepository.delete({});

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

    /** access token */
    let authService = moduleFixture.get<AuthService>(AuthService);
    token = await authService.issueToken({ id: users[0].id, role: Role.admin }, false);
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await dataSource.destroy();
    await app.close();
  });

  describe('[GET /movie]', () => {
    it('should get all movies', async () => {
      const { body, statusCode, error } = await request(app.getHttpServer()).get('/movie');

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('nextCursor');
      expect(body).toHaveProperty('count');

      expect(body.data).toHaveLength(5);
    });
  });

  describe('[GET /movie/recent]', () => {
    it('should get recent movies', async () => {
      const { body, statusCode } = await request(app.getHttpServer())
        .get('/movie/recent')
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body).toHaveLength(10);
    });
  });

  describe('[GET /movie/{id}]', () => {
    it('should get movie by id', async () => {
      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body.id).toBe(movieId);
    });

    it('should throw 404 error if movie does not exist', async () => {
      const movieId = 909999;

      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(404);
    });
  });

  describe('[POST /movie]', () => {
    it('should create movie', async () => {
      const {
        body: { fileName },
      } = await request(app.getHttpServer())
        .post(`/common/video`)
        .set('authorization', `Bearer ${token}`)
        .attach('video', Buffer.from('test'), 'movie.mp4')
        .expect(201);

      const dto = {
        title: 'Test Movie',
        detail: 'A Test Movie Detail',
        directorId: directors[0].id,
        genreIds: genres.map((x) => x.id),
        movieFileName: fileName,
      };

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie`)
        .set('authorization', `Bearer ${token}`)
        .send(dto);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.title).toBe(dto.title);
      expect(body.detail.detail).toBe(dto.detail);
      expect(body.director.id).toBe(dto.directorId);
      expect(body.genres.map((x) => x.id)).toEqual(dto.genreIds);
      expect(body.movieFilePath).toContain(fileName);
    });
  });

  describe('[Patch /movie/{id}]', () => {
    it('should update movie if exist', async () => {
      const dto = {
        title: 'Update Movie',
        detail: 'A Update Movie Detail',
        directorId: directors[0].id,
        genreIds: [genres[0].id],
      };

      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .patch(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`)
        .send(dto);

      expect(statusCode).toBe(200);
      expect(body).toBeDefined();
      expect(body.title).toBe(dto.title);
      expect(body.detail.detail).toBe(dto.detail);
      expect(body.director.id).toBe(dto.directorId);
      expect(body.genres.map((x) => x.id)).toEqual(dto.genreIds);
    });
  });

  describe('[DELETE /movie/{id}]', () => {
    it('should delete movie if exist', async () => {
      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .delete(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
    });

    it('should throw 404 error movie does not exist', async () => {
      const movieId = 9998898;

      const { body, statusCode } = await request(app.getHttpServer())
        .delete(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(404);
    });
  });

  describe('[POST /movie/{id}/like]', () => {
    it('should like a movie', async () => {
      const movieId = movies[3].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
    });

    it('should like a movie cancel', async () => {
      const movieId = movies[3].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.isLike).toBeNull();
    });
  });

  describe('[POST /movie/{id}/dislike]', () => {
    it('should dislike a movie', async () => {
      const movieId = movies[3].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
    });

    it('should dislike a movie cancel', async () => {
      const movieId = movies[3].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.isLike).toBeNull();
    });
  });
});
