import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role, User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
};

const mockUserService = {
  create: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let userService: UserService;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          /** @Inject(CACHE_MANAGER)일때 이런식으로 넣으면 됨, 위에서 타입만 Cache로 해라 */
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tokenBlock', () => {
    it('should block a token', async () => {
      const token = 'token';
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 60,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);

      await authService.tokenBlock(token);

      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `BLOCK_TOKEN_${token}`,
        payload,
        expect.any(Number), // 아무 숫자
      );
    });
  });

  describe('parseBasicToken', () => {
    it('should parse a valid Basic Token', () => {
      const rawToken = 'basic dGVzdGJsYW5jQGdtYWlsLmNvbToxMjMxMjM=';
      const result = authService.parseBasicToken(rawToken);

      const decode = { email: 'testblanc@gmail.com', password: '123123' };

      expect(result).toEqual(decode);
    });

    it('should throw an error for invalid token format', () => {
      const rawToken = 'InvalidTokenFormat';

      /** reject가 아니라 일반 에러 던질땐 이렇게 콜백 함수로 써야함 */
      expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
    });

    it('should throw an error for invalid Basic token format', () => {
      const rawToken = 'Bearer InvalidTokenFormat';

      expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
    });

    it('should throw an error for invalid Basic token format', () => {
      const rawToken = 'basic a';

      expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
    });
  });

  describe('parseBearerToken', () => {
    it('should parse a valid Bearer Token', async () => {
      const rawToken = 'Bearer token';
      const payload = { type: 'access' };

      /** 동기: .mockReturnValue(), 비동기: .mockResolvedValue() */
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');

      const result = await authService.parseBearerToken(rawToken, false);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
        secret: 'secret',
      });
      expect(result).toEqual(payload);
    });

    it('should throw an BadRequestException for invalid Bearer token format', () => {
      const rawToken = 'test';
      expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(BadRequestException);
    });

    it('should throw an BadRequestException for token not staring with Bearer', () => {
      const rawToken = 'Basic test';
      expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(BadRequestException);
    });

    it('should throw an BadRequestException if payload.type is not refresh but isRefreshToken parameter', () => {
      const rawToken = 'Bearer test';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'refresh',
      });

      expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an BadRequestException if payload.type is not refresh but isRefreshToken parameter', () => {
      const rawToken = 'Bearer test';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'access',
      });

      expect(authService.parseBearerToken(rawToken, true)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const rawToken = 'basic test';
      const user = { email: 'testblanc@gmail.com', password: '123123' };

      jest.spyOn(authService, 'parseBasicToken').mockReturnValue(user);
      jest.spyOn(mockUserService, 'create').mockResolvedValue(user);

      const result = await authService.register(rawToken);

      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(userService.create).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('authenticate', () => {
    it('should authenticate a user with correct credentials', async () => {
      const email = 'testblanc@gmail.com';
      const password = '123123';
      const user = { email, password: 'hashedpwd' };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => true);

      const result = await authService.authenticate(email, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(result).toEqual(user);
    });

    it('should throw an error for not exostong user', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(authService.authenticate('testblanc@gmail.com', '123123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should thow an error for incorrect password', async () => {
      const user = { email: 'testblanc@gmail.com', password: '123123' };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => false);

      expect(authService.authenticate('testblanc@gmail.com', '123123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('issueToken', () => {
    const user = { id: 1, role: Role.user };
    const token = 'token';

    /** describe 안에서 반복되는 모킹 */
    beforeEach(() => {
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');
    });

    it('should issue an access token', async () => {
      const result = await authService.issueToken(user as User, false);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          type: 'access',
          role: user.role,
        },
        { secret: 'secret', expiresIn: 300 },
      );
      expect(result).toBe(token);
    });

    it('should issue an access token', async () => {
      const result = await authService.issueToken(user as User, true);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          type: 'refresh',
          role: user.role,
        },
        { secret: 'secret', expiresIn: '24h' },
      );
      expect(result).toBe(token);
    });
  });

  describe('login', () => {
    it('should login a user and return tokens', async () => {
      const rawToken = 'Basic 123';
      const email = 'testblanc@gmail.com';
      const password = '123123';
      const user = { id: 1, role: Role.user };

      jest.spyOn(authService, 'parseBasicToken').mockReturnValue({ email, password });
      jest.spyOn(authService, 'authenticate').mockResolvedValue(user as User);
      jest.spyOn(authService, 'issueToken').mockResolvedValue('mocked.token');

      const result = await authService.login(rawToken);

      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(authService.authenticate).toHaveBeenCalledWith(email, password);
      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(authService.issueToken).toHaveBeenCalledWith(user, true);
      expect(result).toEqual({
        refreshToken: 'mocked.token',
        accessToken: 'mocked.token',
      });
    });
  });
});
