import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGenreDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
