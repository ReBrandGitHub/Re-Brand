import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface CreateKey {
  address: string
  private_key: string
}

@Table({ tableName: 'private_keys' })
export class PrivateKeysModel extends Model<PrivateKeysModel, CreateKey> {
  @Column({ type: DataType.STRING, unique: true, primaryKey: true })
  address: string

  @Column({ type: DataType.STRING })
  private_key: string
}
