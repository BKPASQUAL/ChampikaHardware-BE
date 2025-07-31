import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateStockLocationDto {
  @IsBoolean()
  @IsOptional()
  main?: boolean;

  @IsString()
  @Length(1, 100)
  location_name: string;
}
