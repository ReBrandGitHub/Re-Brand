import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import wallets_contracts from '../../wallets_contracts';

const wallet_keys = [...Object.keys(wallets_contracts)] as const

export type WalletsChoice = typeof wallet_keys[number]

export function validateWalletsChoiceType(data: WalletsChoice) {
  return !!wallet_keys.find((k: string) => k === data)
}

export class WithdrawMoneyDto {
  @IsString({message: 'This field must be string'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly currency: WalletsChoice

  @IsString({message: 'This field must be string'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly wallet: string

  @IsNumber({}, {message: 'This field must be float'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly amount: number
}
