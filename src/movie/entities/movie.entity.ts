import { Exclude, Transform } from 'class-transformer';
// @Expose() // 불러오다
// @Exclude() // 제외하다

export class Movie {
  id: number;

  title: string;

  @Transform(({ value }) => value.toString().toUpperCase())
  genre: string;
}
