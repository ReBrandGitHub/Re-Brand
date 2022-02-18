import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { classToPlain, Exclude } from 'class-transformer';
import { Role } from '../roles/role.enum';
import { NftModel } from '../nft/models/nft.model';
import { CollectionModel } from '../nft/models/collection.model';
import { NftUserModel } from '../nft/models/nft-user.model';
import { NftRequestModel } from '../nft/models/nft-request.model';
import { ListingModel } from '../nft/models/listing.model';
import { SealModel } from './seal.model';

export interface CreateUser {
  email: string
  password: string
  role: Roles
  wallet: string
  verifiedKYC: boolean
  first_name?: string
  last_name?: string
  company?: string
  avatar?: string
  wallet_amounts: Wallets
}

export interface Wallets {
  bsc: {
    wallet_amount: number
  },
  busd: {
    wallet_amount: number
  }
}

export type Roles = 'user' | 'admin' | 'moderator' | 'superadmin'

@Table({ tableName: 'users' })
export class UserModel extends Model<UserModel, CreateUser> {
  @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
  id: number

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  email: string

  @Column({ type: DataType.STRING, unique: false, allowNull: false }) //HASH
  password: string

  @Column({ type: DataType.STRING, unique: false, allowNull: false })
  role: Roles

  @Column({ type: DataType.JSON, unique: false, allowNull: true })
  wallet_amounts: Wallets

  @Column({ type: DataType.STRING, unique: false, allowNull: true })
  wallet: string

  @Column({ type: DataType.STRING, unique: false, allowNull: true })
  first_name: string

  @Column({ type: DataType.STRING, unique: false, allowNull: true })
  last_name: string

  @Column({ type: DataType.STRING, unique: false, allowNull: true })
  company: string

  @Column({ type: DataType.BOOLEAN, unique: false, allowNull: false })
  verifiedKYC: boolean

  @Column({ type: DataType.STRING, unique: false, allowNull: true })
  avatar: string

  @BelongsToMany(() => NftModel, () => NftUserModel)
  nfts: NftModel[]

  @HasMany(() => ListingModel)
  listings: ListingModel[]

  @HasMany(() => NftRequestModel)
  nft_requests: NftRequestModel[]

  @HasMany(() => CollectionModel)
  collections: CollectionModel[]

  @HasMany(() => SealModel)
  seals: SealModel[]

  getPublicData() {
    return {
      id: this.id,
      email: this.email,
      wallet: this.wallet,
      role: this.role,
      wallet_amounts: this.wallet_amounts,
      first_name: this.first_name,
      last_name: this.last_name,
      company: this.company,
      avatar: this.avatar,
      verifiedKYC: this.verifiedKYC
    }
  }
}
