import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockTransferItemDto {
  @IsNumber()
  @IsNotEmpty()
  item_id: number;

  @IsString()
  @IsNotEmpty()
  item_code: string;

  @IsString()
  @IsNotEmpty()
  item_name: string;

  @IsString()
  @IsOptional()
  supplier_name?: string;

  @IsNumber()
  @Min(1)
  requested_quantity: number;

  @IsNumber()
  @Min(0)
  unit_cost: number;

}

export class CreateStockTransferDto {
  @IsNumber()
  @IsNotEmpty()
  source_location_id: number;

  @IsNumber()
  @IsNotEmpty()
  destination_location_id: number;

  @IsDateString()
  transfer_date: string;

  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferItemDto)
  items: CreateStockTransferItemDto[];
}