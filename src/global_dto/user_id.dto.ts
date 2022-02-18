import { IsNotEmpty, IsNumber } from 'class-validator';

export class UserIdDto {
  @IsNumber({}, {message: 'This field must be integer'})
  @IsNotEmpty({message: 'This field cannot be empty'})
  readonly user_id: number
}
