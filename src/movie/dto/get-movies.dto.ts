import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from '../../common/dto/cursor-pagination.dto';

export class GetMoviesDto extends CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '영화의 제목',
    example: '브레이킹 배드',
  })
  title?: string;
}
