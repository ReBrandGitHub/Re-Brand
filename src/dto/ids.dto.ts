import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, Length, Max, Min } from 'class-validator';

export class IdsDto {
  @IsNumber({}, {message: 'This field must be number', each: true})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly ids: number[]
}
