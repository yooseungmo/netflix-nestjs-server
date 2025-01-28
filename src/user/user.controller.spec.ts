import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

const mockedUserService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockedUserService,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('create', () => {
    it('should return corrext value', async () => {
      const createUserDto: CreateUserDto = {
        email: 'testblanc@gmail.com',
        password: '132123',
      };

      const user = {
        id: 1,
        ...createUserDto,
        password: 'hash123123123',
      };

      /** 실제 실행이 아니라 가정만 하므로 User 타입으로 캐스팅함 */
      jest.spyOn(userService, 'create').mockResolvedValue(user as User);

      const result = await userController.create(createUserDto);

      expect(userService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      const users = [
        {
          id: 1,
          email: 'testblanc@gmail.com',
        },
        {
          id: 2,
          email: 'test2blanc@gmail.com',
        },
      ];

      /** 위에 처럼 가정만 하므로 User[] 타입으로 캐스팅함 */
      jest.spyOn(userService, 'findAll').mockResolvedValue(users as User[]);

      const result = await userController.findAll();

      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const user = {
        id: 1,
        email: 'testblanc@gmail.com',
      };

      jest.spyOn(userService, 'findOne').mockResolvedValue(user as User);

      const result = await userController.findOne(1);

      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should return the updated user', async () => {
      const id = 1;
      const updateUserDto: UpdateUserDto = {
        email: 'updateblanc@gmail.com',
      };
      const user = {
        id,
        ...updateUserDto,
      };

      jest.spyOn(userService, 'update').mockResolvedValue(user as User);

      const result = await userController.update(1, updateUserDto);

      expect(userService.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('remove', () => {
    it('should return a single user', async () => {
      const id = 1;

      jest.spyOn(userService, 'remove').mockResolvedValue(id);

      const result = await userController.remove(1);

      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(id);
    });
  });
});
