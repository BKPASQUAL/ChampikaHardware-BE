import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { BusinessType } from 'src/database/enums/business-type.enum';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  business_name: string;

  @IsEnum(BusinessType)
  @IsNotEmpty()
  business_type: BusinessType;  // ✅ match entity
}
