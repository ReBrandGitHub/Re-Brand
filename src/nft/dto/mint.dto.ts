import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Type } from '../models/nft.model';

export class MintDto {
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly name: string

  @IsOptional()
  @Length(0, 3000, {message: 'This field length must be less than 3000'})
  readonly description: string

  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly collection_name: string

  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly category_name: string

  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly emission: string

  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly type: Type

  @IsOptional()
  readonly museum_name: string

  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly nsfw: string

  @IsOptional()
  readonly tags: string

  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly price: string

  @IsOptional()
  readonly seal_url: string
}
