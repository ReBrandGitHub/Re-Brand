import { HttpException, HttpStatus } from '@nestjs/common';


export class UnauthorizedException extends HttpException {
  messages

  constructor(response) {
    super(response, HttpStatus.UNAUTHORIZED);
    this.messages = response
  }
}
