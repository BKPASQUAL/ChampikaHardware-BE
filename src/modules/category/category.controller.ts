import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryDto): Promise<any> {
    const category = await this.categoryService.createCategory(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Category created successfully',
      data: category,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(): Promise<any> {
    const { data, count } = await this.categoryService.getAllCategory();
    return {
      statusCode: HttpStatus.OK,
      message: 'Category fetched successfully',
      data,
      count,
    };
  }
}
