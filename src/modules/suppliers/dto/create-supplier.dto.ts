import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierDto {
  @IsUUID()
  @IsNotEmpty()
  supplier_uuid: string;

  // supplier_code is not UUID → change validation
  @IsString()
  @IsNotEmpty()
  @Length(2, 12)
  supplier_code: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  supplier_name: string;

  @IsString()
  @IsOptional()
  additional_notes?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  contact_person: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  @Min(0) 
  credit_days?: number;
}
