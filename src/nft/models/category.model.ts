import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { classToPlain, Exclude } from 'class-transformer';
import { UserModel } from '../../users/user.model';
import { NftModel } from './nft.model';
import { NftRequestModel } from './nft-request.model';

export interface CreateCategory {
  name: string
  description: string
  image: string
  // user_id?: number
}

@Table({ tableName: 'categories' })
export class CategoryModel extends Model<CategoryModel, CreateCategory> {
  @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
  id: number

  @Column({ type: DataType.STRING(100), unique: true, allowNull: false })
  name: string

  @Column({ type: DataType.STRING(500), unique: false, allowNull: true })
  description: string

  @Column({ type: DataType.STRING, unique: false, allowNull: true })
  image: string

  @HasMany(() => NftModel)
  nfts: NftModel[]

  @HasMany(() => NftRequestModel)
  requests: NftRequestModel[]

  // @Column({ type: DataType.NUMBER, unique: false, allowNull: true })
  @ForeignKey(() => CategoryModel)
  category_id: number

  @BelongsTo(() => CategoryModel)
  category: CategoryModel

  getPublicData(parentCategory?: CategoryModel) {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      image: this.image,
      category_id: this.category_id,
      ...(parentCategory && {
        par_category_name: parentCategory.name
      })
    }
  }
}
