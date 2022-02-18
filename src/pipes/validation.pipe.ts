import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationException } from '../exceptions/validation.exception';


@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (metadata.type === 'custom') return value
    const _value = {}

    //Автоматический парсинг строковых объектов
    for (const v in value) {
      if (typeof value[v] === 'string') {
        if ((value[v][0] === '{' && value[v][value[v].length - 1] === '}') || (value[v][0] === '[' && value[v][value[v].length - 1] === ']')) {
          try {
            _value[v] = JSON.parse(value[v])
          } catch (e) {
            _value[v] = value[v]
          }
        } else {
          _value[v] = value[v]
        }
      } else {
        _value[v] = value[v]
      }
    }
    const obj = plainToClass(metadata.metatype, _value);
    const errors = await validate(obj);

    if (errors.length) {
      const messages = this.transformErrors(errors).flat()
      throw new ValidationException(messages);
    }
    return _value
  }

  private transformErrors(errors) {
    return errors.map(err => {
      if (err.children.length) {
        return this.transformErrors(err.children)
      }
      const returnErrors = {
        field: err.property,
        errors: Object.values(err.constraints || {})
      }
      return returnErrors
    });
  }
}
