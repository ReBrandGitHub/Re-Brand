import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from '../users/user.model';
import { Web3Module } from '../web3/web3.module';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { NftModule } from '../nft/nft.module';

@Module({
  imports: [
    SequelizeModule.forFeature([UserModel]),
    Web3Module,
    NftModule,
    FilesModule,
    UsersModule
  ],
  controllers: [AdminController]
})
export class AdminModule {}
