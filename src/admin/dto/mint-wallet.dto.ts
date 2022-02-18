import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, Length, Max, Min } from 'class-validator';

export class MintWalletDto {
  @IsString({message: 'This field must be string'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly private_key: string
}
