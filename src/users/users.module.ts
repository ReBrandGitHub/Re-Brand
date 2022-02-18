import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { AuthTokenGuard } from '../guards/auth.token.guard';
import { Web3Module } from '../web3/web3.module';
import { FilesModule } from '../files/files.module';
import { SealModel } from './seal.model';

@Module({
  imports: [
    SequelizeModule.forFeature([UserModel, SealModel]),
    FilesModule,
    Web3Module
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
