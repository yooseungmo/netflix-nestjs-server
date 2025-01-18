import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateDirectorDto {
  /**
   * @IsOptional()
   * @IsNotEmpty()
   * 이거 두개 같이 사용 가능
   * 두개 같이 사용하면값이 없을 수는 있지만, 만약 값이 제공된다면 그 값이 비어 있지 않은지 검증
   *
   * 하지만 순서 영향 있어서
   *  @IsNotEmpty() 이거 먼저오면 못씀
   */

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsDateString()
  dob: Date;

  @IsNotEmpty()
  @IsString()
  nationality: string;
}
