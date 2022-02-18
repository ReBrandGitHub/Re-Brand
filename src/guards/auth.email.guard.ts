import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
// import { StorageService } from '../../storage.service';

@Injectable()
export class CredentialsAuthenticateGuard implements CanActivate {
  constructor() {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // const { username, password } = request.body;
    //
    // const user = await this.storageService.users.find(
    //   ({ username: savedUsername }) => savedUsername === username,
    // );
    //
    // if (!user || user.password !== password) throw new UnauthorizedException();

    // request.user = user;
    return true;
  }
}
