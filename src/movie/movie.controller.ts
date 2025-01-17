import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('/movie')
@UseInterceptors(ClassSerializerInterceptor)
// 클래스 트랜스포머를 적용하겠다.
// 직렬화, 역직렬화 과정에서 노출을 안시키는거임
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    return this.movieService.getManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.getMovieById(+id);
  }

  @Post()
  postMovie(@Body() dto: CreateMovieDto) {
    return this.movieService.createMovie(dto);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() dto: UpdateMovieDto) {
    return this.movieService.updateMovie(+id, dto);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
