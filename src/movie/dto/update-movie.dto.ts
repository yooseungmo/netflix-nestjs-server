import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

// export class UpdateMovieDto extends PartialType(CreateMovieDto) {}

export class UpdateMovieDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber(
    {},
    {
      each: true,
    },
  )
  genreIds?: number[];

  @IsOptional()
  @IsNotEmpty()
  detail?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  directorId?: number;
}
