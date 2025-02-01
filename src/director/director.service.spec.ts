import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { Director } from './entities/director.entity';

const mockDirectorRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository,
        },
      ],
    }).compile();

    /** module.get<타입>(프로바이드) */
    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(getRepositoryToken(Director));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new director', async () => {
      const createDirectorDto = {
        name: 'blanc',
      };
      jest.spyOn(mockDirectorRepository, 'save').mockResolvedValue(createDirectorDto);

      const result = await directorService.create(createDirectorDto as CreateDirectorDto);

      expect(directorRepository.save).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toEqual(createDirectorDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of directors', async () => {
      const directors = [
        {
          id: 1,
          name: 'blanc',
        },
      ];

      jest.spyOn(mockDirectorRepository, 'find').mockResolvedValue(directors);

      const result = await directorService.findAll();

      expect(directorRepository.find).toHaveBeenCalled();
      expect(result).toEqual(directors);
    });
  });

  describe('findOne', () => {
    it('should returna single director by id', async () => {
      const id = 1;
      const director = {
        id: 1,
        name: 'blanc',
      };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director as Director);

      const result = await directorService.findOne(id);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(director);
    });
  });

  describe('update', () => {
    it('should update a director', async () => {
      const id = 1;
      const updateDirectorDto = {
        name: 'blanco',
      };
      const existingDirector = {
        id: 1,
        name: 'blanco',
      };
      const updatedDirector = {
        id: 1,
        name: 'blanc',
      };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValueOnce(existingDirector);
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValueOnce(updatedDirector);
      jest.spyOn(mockDirectorRepository, 'update').mockResolvedValue(updatedDirector);

      const result = await directorService.update(id, updateDirectorDto);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(directorRepository.update).toHaveBeenCalledWith({ id }, updateDirectorDto);
      expect(result).toEqual(updatedDirector);
    });

    it('should throw NotiFoundException if director does not exist', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      /** rejects 테스트 할땐 파라미터 넣어줘야함 */
      expect(directorService.update(1, { name: 'blanc' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a director by id', async () => {
      const director = { id: 1, name: 'blanc' };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director);

      const result = await directorService.remove(1);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(directorRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(1);
    });

    it('should throw NotFoundException if director does not exist', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      expect(directorService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
