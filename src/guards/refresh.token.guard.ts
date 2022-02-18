import {
  CACHE_MANAGER,
  CanActivate,
  ExecutionContext, Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '../users/user.model';
import { Cache } from 'cache-manager'

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(UserModel) private usersRepository: typeof UserModel
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = await this.cacheManager.get(`refresh-token:${request?.cookies.Refresh}`) || -1;
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    request.user = user;
    return true;
  }
}
