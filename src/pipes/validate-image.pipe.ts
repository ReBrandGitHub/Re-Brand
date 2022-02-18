import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ValidationException } from '../exceptions/validation.exception';


@Injectable()
export class ValidateImagePipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!Array.isArray(value)) {
      if (!value?.buffer) return value
      // console.log(file);
      const errors = await this.validateFile(value);

      if (errors) {
        throw new ValidationException(errors);
      }
      return value;
    }
    for (const file of value) {
      if (!file.buffer) break
      // console.log(file);
      const errors = await this.validateFile(file);

      if (errors) {
        throw new ValidationException(errors);
      }
    }
    return value
  }

  private validateFile(file: any): Array<any> | null {
    const _validFileExtensions = ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'];
    return _validFileExtensions.find((extension) => extension === file.mimetype) ? null : [{
      field: 'file',
      errors: ['Image extension can be only .jpg, .jpeg, .gif, .png']
    }]
  }
}
