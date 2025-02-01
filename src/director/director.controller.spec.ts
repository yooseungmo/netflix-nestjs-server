import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';

const mockDirectorService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('DirectorController', () => {
  let directorController: DirectorController;
  let directorService: DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        {
          provide: DirectorService,
          useValue: mockDirectorService,
        },
      ],
    }).compile();

    /** module.get<타입>(프로바이드) */
    directorController = module.get<DirectorController>(DirectorController);
    directorService = module.get<DirectorService>(DirectorService);
  });

  it('should be defined', () => {
    expect(directorController).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAll method from DirectorService', async () => {
      const result = [{ id: 1, name: 'blanc' }];

      jest.spyOn(mockDirectorService, 'findAll').mockResolvedValue(result);

      const results = await directorController.findAll();

      expect(results).toEqual(result);
      expect(directorService.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should call findOne method from DirectorService with correct ID', async () => {
      const director = { id: 1, name: 'blanc' };

      jest.spyOn(mockDirectorService, 'findOne').mockResolvedValue(director);

      const result = await directorController.findOne(1);

      expect(result).toEqual(director);
      expect(directorService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should call create method from DirectorService with correct DTO', async () => {
      const creatDirectorDto = { name: 'blanco' };
      const director = { id: 1, name: 'blanc' };

      jest.spyOn(mockDirectorService, 'create').mockResolvedValue(director);

      const result = await directorController.create(creatDirectorDto as CreateDirectorDto);

      expect(result).toEqual(director);
      expect(directorService.create).toHaveBeenCalledWith(creatDirectorDto);
    });
  });

  describe('update', () => {
    it('should call update method from DirctorService with correct ID and DTO', async () => {
      const updateDirectorDto = { name: 'blanco' };
      const director = {
        id: 1,
        name: 'blanc',
      };

      jest.spyOn(mockDirectorService, 'update').mockResolvedValue(director);

      const result = await directorController.update(1, updateDirectorDto);

      expect(result).toEqual(director);
      expect(directorService.update).toHaveBeenCalledWith(1, updateDirectorDto);
    });
  });

  describe('remove', () => {
    it('should call remove method from DirectorService with correct Id', async () => {
      const id = 1;

      jest.spyOn(mockDirectorService, 'remove').mockResolvedValue(id);

      const result = await directorController.remove(1);

      expect(result).toEqual(id);
      expect(directorService.remove).toHaveBeenCalledWith(id);
    });
  });
});
