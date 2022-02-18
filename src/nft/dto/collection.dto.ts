import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CollectionDto {
  @IsString({message: 'This field must be string'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  @Length(0, 100, {message: 'This field length must be less than 3000'})
  readonly name: string

  @IsString({message: 'This field must be string'})
  @IsOptional()
  @Length(0, 500, {message: 'This field length must be less than 3000'})
  readonly description: string
}
