import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AddStockDto {
  @Type(() => Number)
  @IsNumber()
  item_id: number;

  @Type(() => Number)
  @IsNumber()
  location_id: number;

  @Type(() => Number)
  @IsNumber()
  quantity: number;
}
