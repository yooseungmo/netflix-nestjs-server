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
    // throw new Error('Method not implemented.');
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
  title: string;

  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsNotEmpty()
  @IsNumber()
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
  genreIds: number[];
}
