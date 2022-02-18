import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { classToPlain, Exclude } from 'class-transformer';
import { UserModel } from '../../users/user.model';
import { CollectionModel } from './collection.model';
import { NftUserModel } from './nft-user.model';
import { CategoryModel } from './category.model';
import { Type } from './nft.model';

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
  verified: boolean
  category_id: number
}

export interface HistoryPoint {
  event: string
  price: number
  from: string
  to: string
  date: string
}

@Table({ tableName: 'nft-requests-tokens' })
export class NftRequestModel extends Model<NftRequestModel, MintNft> {
  @Column({ type: DataType.INTEGER, unique: true, primaryKey: true, autoIncrement: true })
  id: number

  @Column({ type: DataType.STRING, unique: false, allowNull: false })
  name: string

  @Column({ type: DataType.STRING(3000), unique: false, allowNull: false })
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

  @Column({ type: DataType.ARRAY(DataType.STRING), unique: false, allowNull: false })
  tags: string[]

  @Column({ type: DataType.DOUBLE, unique: false, allowNull: false })
  price: number

  @Column({ type: DataType.INTEGER, unique: false, allowNull: false })
  royalty: number

  @Column({ type: DataType.INTEGER, unique: false, allowNull: false })
  creator_id: number

  @BelongsTo(() => UserModel)
  user: UserModel

  @ForeignKey(() => UserModel)
  user_id: number

  @ForeignKey(() => CollectionModel)
  collection_id: number

  @ForeignKey(() => CategoryModel)
  category_id: number

  @BelongsTo(() => CollectionModel)
  collection: CollectionModel

  @BelongsTo(() => CategoryModel)
  category: CategoryModel

  @Column({ type: DataType.BOOLEAN, unique: false, allowNull: false })
  verified: boolean

  @Column({ type: DataType.STRING, unique: false, allowNull: false })
  type: Type

  getUserInnerData(user: UserModel, category: CategoryModel, collection: CollectionModel, balance: string) {
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
      collection_id: this.collection_id,
      category_id: this.category_id,
      category_name: category.name,
      collection_name: collection.name
    }
  }

  getRequestData(category: CategoryModel, collection: CollectionModel) {
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
      user_id: this.user_id,
      collection_id: this.collection_id,
      category_id: this.category_id,
      category_name: category.name,
      collection_name: collection.name
    }
  }
}
