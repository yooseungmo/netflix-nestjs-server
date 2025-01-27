import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
class PassWordValidator implements ValidatorConstraintInterface {
  validate(
    value: any,
    _validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    // 비밀번호 길이는 4~8
    return value.length >= 4 && value.length <= 8;
  }
  defaultMessage?(_validationArguments?: ValidationArguments): string {
    // throw new Error('Method not implemented.');
    return '비밀번호의 길이는 4~8자 여야합니다. 입력된 비밀번호 : ($value)';
  }
}

function IsPassWordValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: PassWordValidator,
    });
  };
}

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 제목',
    example: '베터 콜 사울',
  })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 설명',
    example: '존잼임',
  })
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '감독 객체 ID',
    example: 1,
  })
  directorId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber(
    {},
    {
      // 배열 내부 값들 number 맞는지 체크
      each: true,
    },
  )
  // postman에서 form-data 사용시 string 밖에 못쓴다. 그래서 @Type() 해줘야함
  @Type(() => Number)
  @ApiProperty({
    description: '장르 IDs',
    example: [1, 2, 3],
  })
  genreIds: number[];

  @IsString()
  @ApiProperty({
    description: '영화 파일 이름',
    example: 'aaa-bbb-ccc-ddd.jpg',
  })
  movieFileName: string;
}
