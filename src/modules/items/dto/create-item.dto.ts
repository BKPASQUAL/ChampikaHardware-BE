// src/modules/items/dto/create-item.dto.ts

import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsNotEmpty,
} from 'class-validator';

export class CreateItemDto {
  @IsUUID()
  @IsNotEmpty()
  item_uuid: string;

  @IsString()
  @IsNotEmpty()
  item_code: string;

  @IsString()
  @IsNotEmpty()
  item_name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  cost_price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  selling_price: number;

  // @IsInt()
  // @IsNotEmpty()
  // quantity: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsInt()
  @IsNotEmpty()
  supplier_id: number;

  @IsInt()
  @IsNotEmpty()
  category_id: number;
}
