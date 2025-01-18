import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTable } from '../../common/entities/base-table.entity';
import { Movie } from '../../movie/entities/movie.entity';

@Entity()
export class Genre extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  name: string;

  @ManyToMany(() => Movie, (movie) => movie.id)
  movies: Movie[];
}
