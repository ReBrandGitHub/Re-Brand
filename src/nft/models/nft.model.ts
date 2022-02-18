import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { classToPlain, Exclude } from 'class-transformer';
import { UserModel } from '../../users/user.model';
import { CollectionModel } from './collection.model';
import { NftUserModel } from './nft-user.model';
import { CategoryModel } from './category.model';
import { ListingModel } from './listing.model';

export interface MintNft {
  name: string
  description: string
  emission: number
  nsfw: boolean
  tags: string[]
  file: string
  seal: string
  museum_name: string
  price: number
  type: Type
  history: HistoryPoint[]
  royalty: number
  creator_id: number
  user_id: number
  collection_id: number
  category_id: number
}

export interface HistoryPoint {
  event: string
  price: number
  from: string
  to: string
  date: string
}

export type Type = 'image' | '3d' | 'audio' | 'video'

@Table({ tableName: 'nft-tokens' })
export class NftModel extends Model<NftModel, MintNft> {
  @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
  id: number

  @Column({ type: DataType.STRING, unique: false, allowNull: false })
  name: string

  @Column({ type: DataType.STRING(3000), unique: false, allowNull: true })
  description: string

  @Column({ type: DataType.INTEGER, unique: false, allowNull: false })
  emission: number

  @Column({ type: DataType.BOOLEAN, unique: false, allowNull: false })
  nsfw: boolean

  @Column({ type: DataType.STRING, unique: false, allowNull: false })
  file: string

  @Column({ type: DataType.STRING, unique: false, allowNull: true })
  seal: string

  @Column({ type: DataType.STRING, unique: false, allowNull: true })
  museum_name: string

  @Column({ type: DataType.ARRAY(DataType.JSON), unique: false, allowNull: false })
  history: HistoryPoint[]

  @Column({ type: DataType.STRING, unique: false, allowNull: false })
  type: Type

  @Column({ type: DataType.ARRAY(DataType.STRING), unique: false, allowNull: true })
  tags: string[]

  @Column({ type: DataType.DOUBLE, unique: false, allowNull: false })
  price: number

  @Column({ type: DataType.INTEGER, unique: false, allowNull: false })
  royalty: number

  @Column({ type: DataType.INTEGER, unique: false, allowNull: false })
  creator_id: number

  @BelongsToMany(() => UserModel, () => NftUserModel)
  users: UserModel[]

  @BelongsTo(() => CollectionModel)
  collection: CollectionModel

  @ForeignKey(() => CollectionModel)
  collection_id: number

  @BelongsTo(() => CategoryModel)
  category: CategoryModel

  @ForeignKey(() => CategoryModel)
  category_id: number

  @HasMany(() => ListingModel)
  listings: ListingModel[]

  getUserInnerData(collection: CollectionModel, category: CategoryModel, user: UserModel, balance: string) {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      emission: this.emission,
      nsfw: this.nsfw,
      file: this.file,
      seal: this.seal,
      museum_name: this.museum_name,
      history: this.history,
      tags: this.tags,
      price: this.price,
      royalty: this.royalty,
      balance: parseInt(balance),
      user_id: user.id,
      type: this.type,
      collection_name: collection.name,
      category_name: category.name,
      collection_id: this.collection_id
    }
  }
}
