import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { GenreService } from './genre.service';

const mockGenreRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('GenreService', () => {
  let genreService: GenreService;
  let genreRepository: Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,
        },
      ],
    }).compile();

    genreService = module.get<GenreService>(GenreService);
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreService).toBeDefined();
  });

  describe('create', () => {
    it('should create a genre successfully', async () => {
      const createGenreDto = { name: 'blanc' };
      const savedGenre = { id: 1, ...createGenreDto };

      jest.spyOn(mockGenreRepository, 'save').mockResolvedValue(savedGenre);

      const result = await genreService.create(createGenreDto);

      expect(genreRepository.save).toHaveBeenCalledWith(createGenreDto);
      expect(result).toEqual(savedGenre);
    });
  });

  describe('findAll', () => {
    it('should return an array of genres', async () => {
      const genres = [{ id: 1, name: 'Blanc' }];

      jest.spyOn(mockGenreRepository, 'find').mockResolvedValue(genres);

      const result = await genreService.findAll();

      expect(result).toEqual(genres);
      expect(genreRepository.find).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a genre of genres', async () => {
      const genre = { id: 1, name: 'Blanc' };

      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre);

      const result = await genreService.findOne(genre.id);

      expect(result).toEqual(genre);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: genre.id },
      });
    });

    it('should thow a NotFoundException if genre is not found', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

      await expect(genreService.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the genre if it exists', async () => {
      const updateGenreDto = { name: 'Blanc' };
      const existingGenre = { id: 1, name: 'Blanc' };
      const updatedGenre = { id: 1, ...updateGenreDto };

      jest
        .spyOn(mockGenreRepository, 'findOne')
        .mockResolvedValueOnce(existingGenre);
      jest
        .spyOn(mockGenreRepository, 'findOne')
        .mockResolvedValueOnce(updatedGenre);

      // await this.genreRepository.update() 이렇게만 있으면 그냥 실행이 되었는지만 체크
      // jest.spyOn(mockGenreRepository, 'update').mockResolvedValue(updatedGenre);

      const result = await genreService.update(1, updateGenreDto);

      expect(result).toEqual(updatedGenre);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(genreRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        updateGenreDto,
      );
    });

    it('should thow a NotFoundException if genre to update does not found', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

      await expect(genreService.update(1, { name: 'blanc' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a genre and return thr id', async () => {
      const genre = { id: 1, name: 'Blanc' };

      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre);

      const result = await genreService.remove(1);

      /** 그냥 단순 값 비교 .toBe() */
      expect(result).toBe(1);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(genreRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should thow a NotFoundException if genre to update does not found', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

      await expect(genreService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
