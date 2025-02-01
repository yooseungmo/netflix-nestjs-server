import { Test, TestingModule } from '@nestjs/testing';
import { CreateGenreDto } from './dto/create-genre.dto';
import { Genre } from './entities/genre.entity';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';

const mockGenreService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('GenreController', () => {
  let genreController: GenreController;
  let genreService: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockGenreService,
        },
      ],
    }).compile();

    genreController = module.get<GenreController>(GenreController);
    genreService = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreController).toBeDefined();
  });

  describe('create', () => {
    it('should call genreService.create with correct parameter', async () => {
      const createGenreDto = {
        name: 'Blanc',
      };
      const createGenre = { id: 1, ...createGenreDto };

      jest
        .spyOn(mockGenreService, 'create')
        .mockResolvedValue(createGenre as CreateGenreDto & Genre);

      const result = await genreController.create(createGenreDto);

      expect(result).toEqual(createGenre);
      expect(genreService.create).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('findAll', () => {
    it('should call genreService.findAll and return an array of genres', async () => {
      const genres = [{ id: 1, name: 'blanc' }];

      jest.spyOn(mockGenreService, 'findAll').mockResolvedValue(genres as Genre[]);

      const result = await genreController.findAll();

      expect(result).toEqual(genres);
      expect(genreService.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should call genreService.findOne and correct id and return the genre', async () => {
      const genre = { id: 1, name: 'blanc' };

      jest.spyOn(mockGenreService, 'findOne').mockResolvedValue(genre);

      const result = await genreController.findOne(1);

      expect(result).toEqual(genre);
      expect(genreService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call genreService.update with correct parameters and return the genre', async () => {
      const updateGenreDto = { name: 'blanc' };
      const genre = { id: 1, ...updateGenreDto };

      jest.spyOn(mockGenreService, 'update').mockResolvedValue(genre as Genre);

      const result = await genreController.update(1, updateGenreDto);

      expect(result).toEqual(genre);
      expect(genreService.update).toHaveBeenCalledWith(1, updateGenreDto);
    });
  });

  describe('remove', () => {
    it('should call genreService.remove with correct parameters and return id of the removed genre', async () => {
      const id = 1;

      jest.spyOn(mockGenreService, 'remove').mockResolvedValue(id);

      const result = await genreController.remove(id);

      expect(result).toEqual(id);
      expect(genreService.remove).toHaveBeenCalledWith(id);
    });
  });
});
