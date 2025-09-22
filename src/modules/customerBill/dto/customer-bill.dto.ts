// src/modules/customerBill/dto/customer-bill.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDate,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  BillStatus,
  PaymentMethod,
} from 'src/database/mysql/customer-bill.entity';

export class CustomerBillItemDto {
  @IsNumber()
  @IsOptional()
  item_id?: number;

  @IsString()
  @IsOptional()
  itemCode?: string;

  @IsString()
  @IsOptional()
  itemName?: string;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  free_quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  category?: string;
}

export class CreateCustomerBillDto {
  @IsNumber()
  @IsNotEmpty()
  customer_id: number;

  @IsString()
  @IsOptional()
  invoiceNo?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
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
  extraDiscount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  extraDiscountAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  finalTotal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalItems?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  location_id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerBillItemDto)
  items: CustomerBillItemDto[];
}
