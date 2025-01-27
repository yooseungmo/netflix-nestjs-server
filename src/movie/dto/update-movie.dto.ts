/** PartialType swagger 에서 불러와야지 스웨거에서 잘 노출됨 */
import { PartialType } from '@nestjs/swagger';
import { CreateMovieDto } from './create-movie.dto';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}
