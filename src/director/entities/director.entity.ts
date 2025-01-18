import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTable } from '../../common/entities/base-table.entity';
import { Movie } from '../../movie/entities/movie.entity';

@Entity()
export class Director extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  dob: Date;

  @Column()
  nationality: string;

  // 앞에 오는건 나의 입장으로 생각하면 편함 "One"
  @OneToMany(() => Movie, (movie) => movie.director)
  movies: Movie[];
}
