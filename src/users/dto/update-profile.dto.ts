import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsString({message: 'This field must be string'})
  @Length(0, 254, { message: 'This field max length is 254' })
  @IsOptional()
  readonly nickname: string

  @IsString({message: 'This field must be string'})
  @Length(0, 254, { message: 'This field max length is 254' })
  @IsOptional()
  readonly first_name: string

  @IsString({message: 'This field must be string'})
  @Length(0, 254, { message: 'This field max length is 254' })
  @IsOptional()
  readonly last_name: string
}
