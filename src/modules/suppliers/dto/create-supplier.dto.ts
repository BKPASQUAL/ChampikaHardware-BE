import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateSupplierDto {
  @IsUUID()
  @IsNotEmpty()
  supplier_uuid: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  supplier_name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  representative_name: string;

  @IsString()
  @IsNotEmpty()
  representative_contact: string;
}
