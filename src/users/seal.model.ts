import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { UserModel } from './user.model';

export interface CreateSeal {
  name: string
  user_id: number
  seal_url: string
}

@Table({ tableName: 'seals' })
export class SealModel extends Model<SealModel, CreateSeal> {
  @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
  id: number

  @Column({ type: DataType.STRING, unique: false, allowNull: false })
  name: string

  @BelongsTo(() => UserModel)
  user: UserModel

  @Column({ type: DataType.INTEGER, unique: false, allowNull: false })
  @ForeignKey(() => UserModel)
  user_id: number

  @Column({ type: DataType.STRING, unique: false, allowNull: false })
  seal_url: string
}
