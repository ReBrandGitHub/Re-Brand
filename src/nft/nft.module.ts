import { Module } from '@nestjs/common';
import { NftController } from './nft.controller';
import { NftService } from './nft.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { NftModel } from './models/nft.model';
import { CollectionModel } from './models/collection.model';
import { UsersModule } from '../users/users.module';
import { UserModel } from '../users/user.model';
import { FilesModule } from '../files/files.module';
import { NftUserModel } from './models/nft-user.model';
import { Web3Module } from '../web3/web3.module';
import { CategoryModel } from './models/category.model';
import { NftRequestModel } from './models/nft-request.model';
import { SealModel } from '../users/seal.model';
import { MintService } from './mint.service';

@Module({
  imports: [
    SequelizeModule.forFeature([UserModel, CategoryModel, NftRequestModel, CollectionModel, NftModel, NftUserModel]),
    Web3Module,
    FilesModule,
    UsersModule
  ],
  controllers: [NftController],
  providers: [NftService, MintService],
  exports: [NftService]
})
export class NftModule {}
