import { HttpException, HttpStatus } from '@nestjs/common';


export class ConflictException extends HttpException {
  messages

  constructor(response) {
    super(response, HttpStatus.CONFLICT);
    this.messages = response
  }
}
