import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsDate, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BillStatus, PaymentMethod } from 'src/database/mysql/customer-bill.entity';

export class CustomerBillItemDto {
  @IsNumber()
  @IsNotEmpty()
  item_id: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  free_quantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateCustomerBillDto {
  @IsNumber()
  @IsNotEmpty()
  customer_id: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  billing_date?: Date;

  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod;

  @IsEnum(BillStatus)
  @IsOptional()
  status?: BillStatus;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax_amount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  paid_amount?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  reference_no?: string;

  @IsNumber()
  @IsOptional()
  location_id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerBillItemDto)
  items: CustomerBillItemDto[];
}