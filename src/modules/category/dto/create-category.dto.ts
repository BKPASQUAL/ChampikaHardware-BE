import { IsEnum, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { CategoryType } from 'src/database/enums/category-type.enum';

export class CreateCategoryDto {
  @IsUUID()
  @IsNotEmpty()
  category_uuid: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  category_name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  category_code: string;

  @IsEnum(CategoryType)
  @IsNotEmpty()
  category_type: CategoryType;
}
