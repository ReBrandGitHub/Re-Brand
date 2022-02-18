import { Module } from '@nestjs/common';
import { WalletGateway } from './wallet.gateway';
import { UsersModule } from '../users/users.module';
import { Web3Module } from '../web3/web3.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from '../users/user.model';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  providers: [WalletGateway, WalletService],
  imports: [
    SequelizeModule.forFeature([UserModel]),
    UsersModule,
    Web3Module
  ],
  controllers: [WalletController]
})
export class WalletModule {}
