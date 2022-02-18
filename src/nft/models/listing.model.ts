import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasOne, Model, Table } from 'sequelize-typescript';
import { classToPlain, Exclude } from 'class-transformer';
import { UserModel } from '../../users/user.model';
import { CollectionModel } from './collection.model';
import { NftUserModel } from './nft-user.model';
import { CategoryModel } from './category.model';
import { NftModel } from './nft.model';

export interface CreateListing {
  nft_id: number
  user_id: number
  price: number
  currency: string
  amount: number
}

@Table({ tableName: 'listings' })
export class ListingModel extends Model<ListingModel, CreateListing> {
  @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
  id: number

  @BelongsTo(() => NftModel)
  nft: NftModel

  @ForeignKey(() => NftModel)
  nft_id: number

  @BelongsTo(() => UserModel)
  user: UserModel

  @Column({ type: DataType.FLOAT, unique: false, allowNull: false })
  price: number

  @Column({ type: DataType.STRING, unique: false, allowNull: false })
  currency: string

  @Column({ type: DataType.INTEGER, unique: false, allowNull: false })
  amount: number

  @Column({ type: DataType.INTEGER, unique: false, allowNull: false })
  likes: number

  @ForeignKey(() => UserModel)
  user_id: number
}
