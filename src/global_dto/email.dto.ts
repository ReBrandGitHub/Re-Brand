import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmailDto {
  @IsString({message: 'This field must be string'})
  @IsEmail({}, {message: 'Invalid email'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly email: string
}
