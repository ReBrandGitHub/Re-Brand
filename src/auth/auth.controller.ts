import { Body, Controller, Header, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from '../guards/refresh.token.guard';
import { GetUser } from '../users/user.decorator';
import { UserModel } from '../users/user.model';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
  }

  @Post('register')
  @Header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS')
  @Header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Set-Cookie')
  @Header('supportsCredentials', 'true')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const data = await this.authService.register(dto);
    res.cookie('Authentication', data.accessToken, {
      expires: new Date(data.accessTokenExpireDate),
      httpOnly: true,
      domain: process.env.NODE_ENV === 'production' ? '.cryptopostcards.io' : null,
    });
    res.cookie('Refresh', data.refreshToken, {
      expires: new Date(data.refreshTokenExpireDate),
      httpOnly: true,
      domain: process.env.NODE_ENV === 'production' ? '.cryptopostcards.io' : null,
    });
    return res.send({
      ...data.user,
      accessTokenExpireDate: data.accessTokenExpireDate,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS')
  @Header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Set-Cookie')
  @Header('supportsCredentials', 'true')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const data = await this.authService.login(dto);
    res.cookie('Authentication', data.accessToken, {
      expires: new Date(data.accessTokenExpireDate),
      httpOnly: true,
      domain: process.env.NODE_ENV === 'production' ? '.cryptopostcards.io' : null,
    });
    res.cookie('Refresh', data.refreshToken, {
      expires: new Date(data.refreshTokenExpireDate),
      httpOnly: true,
      domain: process.env.NODE_ENV === 'production' ? '.cryptopostcards.io' : null,
    });
    return res.send({
      ...data.user,
      accessTokenExpireDate: data.accessTokenExpireDate,
    });
  }

  @Post('refresh-token')
  @UseGuards(RefreshTokenGuard)
  @Header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS')
  @Header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Set-Cookie')
  @Header('supportsCredentials', 'true')
  async refreshToken(@GetUser() user: UserModel, @Res() res: Response) {
    const data = await this.authService.createAndSaveTokenPair(user.id.toString());
    res.cookie('Authentication', data.accessToken, {
      expires: new Date(data.accessTokenExpireDate),
      httpOnly: true,
      domain: process.env.NODE_ENV === 'production' ? '.cryptopostcards.io' : null,
    });
    res.cookie('Refresh', data.refreshToken, {
      expires: new Date(data.refreshTokenExpireDate),
      httpOnly: true,
      domain: process.env.NODE_ENV === 'production' ? '.cryptopostcards.io' : null,
    });
    return res.send({
      accessTokenExpireDate: data.accessTokenExpireDate,
    });
  }
}
