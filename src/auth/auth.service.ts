import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthCacheService } from './auth.cache.service';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { compare, genSalt, hash } from 'bcryptjs';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';

@Injectable()
export class AuthService {
  constructor(
    private authCacheService: AuthCacheService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.createUser(dto)
    const tokens = await this.createAndSaveTokenPair(user.id.toString())
    return {
      user: user.getPublicData(),
      ...tokens
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.getUserByEmail(dto.email)
    if (!user) throw new UnauthorizedException([{
      field: 'auth',
      errors: ['Invalid email or password']
    }])
    const isCorrectPassword = await compare(dto.password, user.password);
    if (!isCorrectPassword) {
      throw new UnauthorizedException([{
        field: 'auth',
        errors: ['Invalid email or password']
      }]);
    }

    const tokens = await this.createAndSaveTokenPair(user.id.toString())
    return {
      user: user.getPublicData(),
      ...tokens
    }
  }




  private static getExpireDate(seconds: number): string {
    return new Date(new Date(Date.now() + seconds * 1000).toUTCString()).toISOString();
  }

  async createAndSaveTokenPair(userId: string) {
    //Создание токенов
    const accessToken = randomUUID();
    const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE);
    const accessTokenExpireDate = AuthService.getExpireDate(accessTokenExpire);
    const accessTokenCookie = `Authentication=${accessToken}; Path=/; Expires=${accessTokenExpireDate}; HttpOnly`


    // this.cookiesService.getAccessTokenCookie(
    //   accessToken,
    //   accessTokenExpireDate,
    // );

    //Создание токенов 2
    const refreshToken = randomUUID();
    const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE);
    const refreshTokenExpireDate = AuthService.getExpireDate(refreshTokenExpire);
    const refreshTokenCookie = `Refresh=${refreshToken}; Path=/; Expires=${refreshTokenExpireDate}; HttpOnly`

    //Удаление старых токенов пользователя
    await this.authCacheService.deleteCache(userId);

    //Сохранение новых токенов пользователя
    await this.authCacheService.setTokens(
      userId,
      accessToken,
      refreshToken,
      accessTokenExpire,
      refreshTokenExpire,
    );
    return { accessTokenCookie, accessToken, refreshToken, refreshTokenCookie, accessTokenExpireDate, refreshTokenExpireDate };
  }
}
