import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
// @Expose() // 불러오다
// @Exclude() // 제외하다

// Entity Embedding
export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

@Entity()
export class Movie extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;
}

/**
 *
 * 1. Embedding Entity는 DB에서 속성과 컬럼 이름이 붙어서 나온다.
 * @Column(() => BaseEntity)
 * ex) baseCreatedAt
 * ++ res값에도 객체처럼 인식해서 한 depth 더 깊게 나옴
 *
 * 2. Inheritence는 extends로 OOP 처럼 사용하고
 * 따로 base 컬럼같은거 필요없음
 * DB에도 컬럼값만 그대로 잘 나옴
 *
 */
