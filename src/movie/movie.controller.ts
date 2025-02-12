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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryRunner as QR } from 'typeorm';
import { Public } from '../auth/decorator/public.decorator';
import { RBAC } from '../auth/decorator/rbac.decorator';
import { AuthGuard } from '../auth/guard/auth.guard';
import { QueryRunner } from '../common/decorator/query-runner.decorator';
import { Throttle } from '../common/decorator/throttle.decorator';
import { TransactionInterceptor } from '../common/interceptor/transaction.interceptor';
import { UserId } from '../user/decorator/user-id.decorator';
import { Role } from '../user/entities/user.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';

@Controller('/movie')
@ApiBearerAuth()
@ApiTags('movie')
@UseInterceptors(ClassSerializerInterceptor)
// 직렬화, 역직렬화 과정에서 @Exclude(), @Expose() 데코레이터를 사용해 노출을 제한
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  @ApiOperation({
    description: '[Movie]를 Pagination 하는 API',
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 API Pagination을 실행 했을때!',
  })
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId: number) {
    return this.movieService.findAll(dto, userId);
  }

  @Get('recent')
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseGuards(AuthGuard)
  @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() dto: CreateMovieDto,
    /** req가 any 타입이라서 custom decorator로 확인을 해주는게 안전함 */
    // @Request() req,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.create(dto, userId, queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMovieDto) {
    return this.movieService.update(id, dto);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }

  @Post(':id/like')
  createMovieLike(@Param('id', ParseIntPipe) movieId: number, @UserId() userId: number) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(@Param('id', ParseIntPipe) movieId: number, @UserId() userId: number) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
