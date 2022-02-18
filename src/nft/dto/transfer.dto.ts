import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Type } from '../models/nft.model';

export class TransferNftDto {
  @IsNumber({}, { message: 'This field must be integer' })
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly token_id: number

  @IsString({ message: 'This field must be string' })
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly to_user: string

  @IsNumber({}, { message: 'This field must be integer' })
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly quantity: number
}

export class WithdrawNftDto {
  @IsNumber({}, { message: 'This field must be integer' })
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly token_id: number

  @IsString({ message: 'This field must be string' })
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly wallet: string

  @IsNumber({}, { message: 'This field must be integer' })
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly quantity: number
}
