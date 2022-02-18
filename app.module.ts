import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { UserModel } from './users/user.model';
import { NftModule } from './nft/nft.module';
import { NftModel } from './nft/models/nft.model';
import { CollectionModel } from './nft/models/collection.model';
import { Web3Module } from './web3/web3.module';
import { PrivateKeysModel } from './web3/privateKeys.model';
import { WalletModule } from './wallet/wallet.module';
import { FilesModule } from './files/files.module';
import { NftUserModel } from './nft/models/nft-user.model';
import { CategoryModel } from './nft/models/category.model';
import { NftRequestModel } from './nft/models/nft-request.model';
import { ListingModel } from './nft/models/listing.model';
import type { ClientOpts as RedisClientOpts } from 'redis';
import { AdminModule } from './admin/admin.module';
import * as redisStore from 'cache-manager-redis-store';
import { SealModel } from './users/seal.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    CacheModule.register<RedisClientOpts>({
      ...((process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'docker') && {
        store: redisStore,
        // Store-specific configuration:
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      }),
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({
      useFactory: () => ({
        dialect: 'postgres',
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        username: process.env.POSTGRES_LOGIN,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_AUTHDATABASE,
        models: [PrivateKeysModel, SealModel, CategoryModel, ListingModel, NftRequestModel, UserModel, CollectionModel, NftModel, NftUserModel],
        autoLoadModels: true,
      }),
    }),
    Web3Module,
    AuthModule,
    UsersModule,
    NftModule,
    WalletModule,
    FilesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
