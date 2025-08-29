import { IsString, IsNumber, IsOptional } from 'class-validator';

export class SupplierBillItemDto {
  @IsNumber()
  id: number;

  @IsString()
  itemCode: string;

  @IsString()
  itemName: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  amount: number;

  @IsNumber()
  @IsOptional()
  freeItemQuantity?: number;

  @IsOptional()
  @IsNumber()
  mrp?: number;

  @IsOptional()
  @IsNumber()
  sellingPrice?: number;
}
