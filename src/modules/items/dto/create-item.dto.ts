// src/modules/items/dto/create-item.dto.ts

import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsInt,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { UnitType } from 'src/database/enums/item-type.enum';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  item_code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  item_name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  additional_notes?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  cost_price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  mrp: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  selling_price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  rep_commision?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  minimum_selling_price?: number;

  @IsEnum(UnitType)
  @IsNotEmpty()
  unit_type: UnitType;

  @IsNumber({ maxDecimalPlaces: 1 })
  @IsOptional()
  unit_quantity?: number;

  @IsInt()
  @IsNotEmpty()
  supplier_id: number;

  @IsInt()
  @IsNotEmpty()
  category_id: number;

  @IsOptional()
  images?: string[];
}
