import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetWalletDto {
  @IsString({message: 'This field must be string'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly address: string

  @IsNumber({}, {message: 'This field must be number'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly payment_amount: number
}
