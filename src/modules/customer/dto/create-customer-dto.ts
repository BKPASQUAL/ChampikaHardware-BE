// src/modules/customer/dto/create-customer.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  Length,
} from 'class-validator';
import { CustomerType } from 'src/database/mysql/customer.entity';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  customerName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  shopName: string;


  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType = CustomerType.RETAIL;

  @IsInt()
  @IsOptional()
  areaId: number;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsNotEmpty()
  @Length(7, 20)
  contactNumber: string;
  // If you want stricter phone number validation
  // @IsPhoneNumber('LK')  // for Sri Lanka
  // contactNumber: string;

  @IsInt()
  @IsOptional()
  assignedRepId: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
