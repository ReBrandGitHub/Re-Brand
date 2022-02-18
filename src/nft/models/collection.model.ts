import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { classToPlain, Exclude } from 'class-transformer';
import { UserModel } from '../../users/user.model';
import { NftModel } from './nft.model';
import { NftRequestModel } from './nft-request.model';

export interface CreateCollection {
  name: string
  description: string
  global: boolean
  image: string
  user_id?: number
}

@Table({ tableName: 'collections' })
export class CollectionModel extends Model<CollectionModel, CreateCollection> {
  @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
  id: number

  @Column({ type: DataType.STRING(100), unique: true, allowNull: false })
  name: string

  @Column({ type: DataType.STRING(500), unique: false, allowNull: true })
  description: string

  @Column({ type: DataType.BOOLEAN, unique: false, allowNull: false })
  global: boolean

  @Column({ type: DataType.STRING, unique: false, allowNull: true })
  image: string

  @HasMany(() => NftModel)
  nfts: NftModel[]

  @HasMany(() => NftRequestModel)
  requests: NftRequestModel[]

  @BelongsTo(() => UserModel)
  user: UserModel

  @ForeignKey(() => UserModel)
  user_id: number

  getUserCollection() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      global: this.global,
      image: this.image
    }
  }
}
