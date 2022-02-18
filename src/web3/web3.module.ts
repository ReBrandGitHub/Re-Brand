import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { PrivateKeysModel } from './privateKeys.model';
import { WalletGateway } from '../wallet/wallet.gateway';

@Module({
  imports: [
    SequelizeModule.forFeature([PrivateKeysModel]),
  ],
  providers: [Web3Service],
  exports: [Web3Service]
})
export class Web3Module {}
