import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsCustomPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    void args;
    if (!password) return false;
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    return typeof password === 'string' && regex.test(password);
  }
  defaultMessage(args: ValidationArguments) {
    void args;

    return 'Mật khẩu yếu phải có ít nhất 8 ký tự có chữ hoa, chữ thường và kí tự số';
  }
}
export function IsCustomPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCustomPasswordConstraint,
    });
  };
}
