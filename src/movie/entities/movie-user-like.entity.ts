import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Movie } from './movie.entity';

@Entity()
export class MovieUserLike {
  // composite primarykey (복합 키)
  @PrimaryColumn({
    name: 'movieId',
    type: 'int8',
  })
  @ManyToOne(() => Movie, (movie) => movie.likeUsers, {
    onDelete: 'CASCADE',
  })
  movie: Movie;

  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.likedMovies, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  isLike: boolean;
}
