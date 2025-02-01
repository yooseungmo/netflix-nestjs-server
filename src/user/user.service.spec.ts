import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

/** 실행이 되는지만 중요, 어떤식으로 실행이 되는지는 Unit Test에서 */
const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          /** TypeOrmModule.forFeature 와 똑같이 취급 */
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    /** 만든 Testing Module에서 IoC컨테이너로 인해서 값들이 inject 해온거 반영해서 갖고옴*/
    userService = module.get<UserService>(UserService);
  });

  /** 각각의 it 테스트 할때마다 모킹한거 초기화 시켜줌 */
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          email: 'testblanc@gmail.com',
        },
      ];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, email: 'testblanc@gmail.com' };

      /** mockUserRepository.findOne.mockResolvedValue(user) 이거랑 아래랑 같음 */
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it('should throw a NotFoundException if user is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      const id = 999;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
      });

      const result = await userService.remove(id);

      expect(result).toEqual(id);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
      });
    });

    it('shoule throw a NotFoundException if user to delete is not found', () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new user and return id', async () => {
      const createUserDto: CreateUserDto = {
        email: 'testblanc@gmail.com',
        password: '123123',
      };

      const hashRound = 10;
      const hashedPassword = 'hash123123123';
      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRound);
      jest.spyOn(bcrypt, 'hash').mockImplementation((password, hashRound) => hashedPassword);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);

      const createUser = await userService.create(createUserDto);

      expect(createUser).toEqual(result);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: createUserDto.email },
      });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { email: createUserDto.email },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      /** 실행이 되는지만 중요, 어떤식으로 실행이 되는지는 Unit Test에서 */
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, hashRound);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('should throw a BadRequestException if email already exists', () => {
      const createUserDto: CreateUserDto = {
        email: 'testblanc@gmail.com',
        password: '123123',
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
        email: createUserDto.email,
      });

      expect(userService.create(createUserDto)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });
  });

  describe('update', () => {
    it('should upadte a user if it exists and return the updated user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'testblanc@gmail.com',
        password: '123123',
      };

      const hashRound = 10;
      const hashedPassword = 'hash1234564';
      const user = {
        id: 1,
        email: updateUserDto.email,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRound);
      jest.spyOn(bcrypt, 'hash').mockImplementation((password, hashRound) => hashedPassword);
      jest.spyOn(mockUserRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        ...user,
        password: hashedPassword,
      });

      const result = await userService.update(1, updateUserDto);

      expect(result).toEqual({
        ...user,
        password: hashedPassword,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, hashRound);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        {
          id: 1,
        },
        {
          ...updateUserDto,
          password: hashedPassword,
        },
      );
    });

    it('should throw a NotFoundException if user to update is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      const updateUserDto: UpdateUserDto = {
        email: 'testblanc@gmail.com',
        password: '123123',
      };

      expect(userService.update(999, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
});
