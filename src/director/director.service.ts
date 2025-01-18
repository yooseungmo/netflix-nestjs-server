import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { Director } from './entities/director.entity';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}

  create(createDirectorDto: CreateDirectorDto) {
    return this.directorRepository.save(createDirectorDto);
  }

  findAll() {
    return this.directorRepository.find();
  }

  findOne(id: number) {
    return this.directorRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorRepository.findOne({
      where: { id },
    });
    if (!director) {
      throw new NotFoundException('이건 없다잉');
    }

    await this.directorRepository.update({ id }, { ...updateDirectorDto });

    const newDirector = await this.directorRepository.findOne({
      where: { id },
    });

    return newDirector;
  }

  remove(id: number) {
    return this.directorRepository.delete(id);
  }
}
