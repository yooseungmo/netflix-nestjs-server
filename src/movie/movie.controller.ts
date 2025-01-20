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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../auth/\bguard/auth.guard';
import { Public } from '../auth/decorator/public.decorator';
import { RBAC } from '../auth/decorator/rbac.decorator';
import { Role } from '../user/entities/user.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';

@Controller('/movie')
@UseInterceptors(ClassSerializerInterceptor)
// 클래스 트랜스포머를 적용하겠다.
// 직렬화, 역직렬화 과정에서 노출을 안시키는거임
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  getMovies(@Query() dto: GetMoviesDto) {
    return this.movieService.findAll(dto);
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseGuards(AuthGuard)
  postMovie(@Body() dto: CreateMovieDto) {
    return this.movieService.create(dto);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: string,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, dto);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
