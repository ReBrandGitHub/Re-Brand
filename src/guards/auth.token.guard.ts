import {
  CACHE_MANAGER,
  CanActivate,
  ExecutionContext, ForbiddenException, Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthCacheService } from '../auth/auth.cache.service';
import { Cache } from 'cache-manager'
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '../users/user.model';
import { Role } from '../roles/role.enum';
import { ROLES_KEY } from '../roles/roles.decorator';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';
// import { StorageService } from '../../storage.service';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    // private authCacheService: AuthCacheService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(UserModel) private usersRepository: typeof UserModel
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.get<boolean>('isPublic', context.getHandler()))
      return true;

    const request = context.switchToHttp().getRequest();
    //Поиск в кэше токена пользователя
    const userId = await this.cacheManager.get(`access-token:${request?.cookies?.Authentication}`) || -1;
    //Поиск пользователя по бд
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException([{
      field: 'auth',
      errors: ['Unauthorized']
    }]);

    const expectedRole = user.role;
    const needed = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (needed && needed.length) {
      const allow = needed.some((role) => expectedRole === role)
      if (!allow) throw new ForbiddenException();
    }
    request.user = user.toJSON();
    return true;
  }
}
