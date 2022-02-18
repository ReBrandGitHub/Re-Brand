import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCacheService } from './auth.cache.service';
import { UsersModule } from '../users/users.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from '../users/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([UserModel]),
    UsersModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCacheService,
    AuthService
  ],
  exports: [AuthService]
})
export class AuthModule {}
