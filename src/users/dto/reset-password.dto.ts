import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString({message: 'This field must be string'})
  @IsNotEmpty({ message: 'This field cannot be empty' })
  @Length(0, 254, { message: 'This field max length is 254' })
  readonly token: string

  @IsString({message: 'This field must be string'})
  @IsNotEmpty({ message: 'This field cannot be empty' })
  @Length(0, 254, { message: 'This field max length is 254' })
  readonly password: string
}
