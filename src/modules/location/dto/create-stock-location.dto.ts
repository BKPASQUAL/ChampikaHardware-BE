import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  IsNumber,
} from 'class-validator';

export class CreateStockLocationDto {
  @IsString()
  @Length(1, 50)
  location_code: string;

  @IsString()
  @Length(1, 100)
  location_name: string;

  @IsNumber()
  business_id: number; // ✅ required because location must belong to a business

  @IsNumber()
  @IsOptional()
  responsible_user_id?: number; // optional FK

  @IsNumber()
  @IsOptional()
  parent_location_id?: number; // optional FK (for sub-locations)

  @IsBoolean()
  @IsOptional()
  main?: boolean; // ✅ custom field you added
}
