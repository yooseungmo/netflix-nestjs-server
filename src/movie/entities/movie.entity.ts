import { Transform } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entities/base-table.entity';
import { Director } from '../../director/entities/director.entity';
import { Genre } from '../../genre/entities/genre.entity';
import { User } from '../../user/entities/user.entity';
import { MovieDetail } from './movie-detail.entity';
import { MovieUserLike } from './movie-user-like.entity';
/**
 * ManyToOne -> Director
 * OneToOne -> MovieDetail
 * ManyToMany -> Genre
 */

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.createMovies)
  creator: User;

  @Column({
    unique: true,
  })
  title: string;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  /**
   * @ManyToOne / @OneToMany 관계와 FK컬럼으로 관리 가능하지만,
   * @ManyToMany다대다 관계가 필수적인 경우, @JoinTable()과 함께 사용하는 것이 권장
   * TypeORM이 자동으로 조인 테이블 생성 및 관계 데이터를 관리해 주기 때문에 효율적
   */
  @JoinTable()
  genres: Genre[];

  @Column({
    default: 0,
  })
  likeCount: number;

  @Column({
    default: 0,
  })
  dislikeCount: number;

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true, // 릴레이션 된 테이블까지 자동으로 저장하거나 삭제
    /**
     *  null이 될수 없다
     *  TypeOrm에서만 적용되는게 아니라 실제 DB에서 적용됨
     *  릴레이션 값만 따로 지워지는거 방지
     *  데이터 무결성 !
     */
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetail;

  @Column()
  @Transform(({ value }) =>
    process.env.ENV === 'prod'
      ? `http://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${value}`
      : `http://localhost:3000/${value}`,
  )
  movieFilePath: string;

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: Director;

  @OneToMany(() => MovieUserLike, (mul) => mul.movie)
  likeUsers: MovieUserLike[];
}

/**
 * 1. Embedding Entity는 DB에서 속성과 컬럼 이름이 붙어서 나온다.
 * @Column(() => BaseEntity)
 * ex) baseCreatedAt
 * ++ res값에도 객체처럼 인식해서 한 depth 더 깊게 나옴
 *
 * 2. Inheritence는 extends로 OOP 처럼 사용하고
 * 따로 base 컬럼같은거 필요없음
 * DB에도 컬럼값만 그대로 잘 나옴
 */
