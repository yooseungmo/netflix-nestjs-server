import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';

@Controller('/movie')
@UseInterceptors(ClassSerializerInterceptor)
// 클래스 트랜스포머를 적용하겠다.
// 직렬화, 역직렬화 과정에서 노출을 안시키는거임
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query('title', MovieTitleValidationPipe) title?: string) {
    return this.movieService.findAll(title);
  }

  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  @Post()
  postMovie(@Body() dto: CreateMovieDto) {
    return this.movieService.create(dto);
  }

  @Patch(':id')
  patchMovie(
    @Param('id', ParseIntPipe) id: string,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, dto);
  }

  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
