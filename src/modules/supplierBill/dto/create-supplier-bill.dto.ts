import { Type } from 'class-transformer';
import { SupplierBillItemDto } from './create-supplier-bill-item.dto';
import {
  IsString,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';

export class CreateSupplierBillDto {
  @IsString()
  supplierId: string;

  @IsString()
  supplierName: string;

  @IsString()
  billNo: string;

  @IsDateString()
  billingDate: string;

  @IsDateString()
  receivedDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierBillItemDto)
  items: SupplierBillItemDto[];

  @IsString()
  @IsOptional()
  extraDiscount?: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  extraDiscountAmount: number;

  @IsNumber()
  finalTotal: number;

  
}
