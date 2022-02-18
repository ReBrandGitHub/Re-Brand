import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator((_, request: ExecutionContext) => {
  const req = request.switchToHttp().getRequest()
  return req.user;
});
