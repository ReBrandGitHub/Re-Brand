import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MintDto } from './mint.dto';
import { Type } from 'class-transformer';

export class MintBatchDto {
  @ValidateNested()
  @Type(() => MintDto)
  nfts: MintDto[]
}
