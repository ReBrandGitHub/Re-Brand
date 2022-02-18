import {
  CACHE_MANAGER,
  CanActivate,
  ExecutionContext, Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthCacheService } from '../auth/auth.cache.service';
import { Cache } from 'cache-manager'
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '../users/user.model';
import { Role } from '../roles/role.enum';
import { ROLES_KEY } from '../roles/roles.decorator';
import { ForbiddenException } from '../exceptions/forbidden.exception';
// import { StorageService } from '../../storage.service';

@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(
    // private reflector: Reflector,
    // // private authCacheService: AuthCacheService,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // @InjectModel(UserModel) private usersRepository: typeof UserModel
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user
    if (!user) throw new UnauthorizedException();
    if (!user.verifiedKYC) throw new ForbiddenException([{
      field: 'verifiedKYC',
      errors: ['You must be verified by KYC']
    }])
    return true;
  }
}
