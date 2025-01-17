import {
  IsNotEmpty,
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
  title: string;

  @IsNotEmpty()
  genre: string;
}
