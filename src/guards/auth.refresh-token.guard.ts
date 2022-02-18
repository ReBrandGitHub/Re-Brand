import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthCacheService } from '../auth/auth.cache.service';
// import { StorageService } from '../../storage.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private authCacheService: AuthCacheService,
    // private storageService: StorageService, БД
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    //Поиск пользователя в кэше
    const userId = await this.authCacheService.getUserIdByRefreshToken(
      request?.cookies.Refresh,
    );

    //Поиск пользователя по id
    // const user = await this.storageService.users.find(
    //   ({ userId: savedUserId }) => savedUserId === userId,
    // );


    // if (!user) throw new UnauthorizedException();
    // request.user = user;
    return true;
  }
}
