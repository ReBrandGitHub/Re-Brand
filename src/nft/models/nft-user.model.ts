import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { UserModel } from '../../users/user.model';
import { HistoryPoint, NftModel } from './nft.model';

export interface Assign {
  user_id: number
  nft_id: number
  amount: number
}

@Table({ tableName: 'nft-users' })
export class NftUserModel extends Model<NftUserModel, Assign> {
  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  user_id: number

  @BelongsTo(() => UserModel)
  user: UserModel

  @ForeignKey(() => NftModel)
  @Column({ type: DataType.INTEGER })
  nft_id: number

  @BelongsTo(() => NftModel)
  nft: NftModel

  @Column({ type: DataType.INTEGER, validate: { min: 0 } })
  amount: number
}
