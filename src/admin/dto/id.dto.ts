import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, Length, Max, Min } from 'class-validator';

export class IdDto {
  @IsNumber({}, {message: 'This field must be number'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly id: number
}
