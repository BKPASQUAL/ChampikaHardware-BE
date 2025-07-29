import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from 'src/database/mysql/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    try {
      const existing = await this.categoryRepository.findOne({
        where: {
          category_uuid: dto.category_uuid,
        },
      });

      if (existing) {
        throw new BadRequestException('Category with this UUID already exists');
      }

      const newCategory = this.categoryRepository.create({
        ...dto,
        category_uuid: uuidv4(),
      });
      return await this.categoryRepository.save(newCategory);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create category',
        error.message,
      );
    }
  }

  async getAllCategory(): Promise<{ data: Category[]; count: number }> {
    try {
      const [category, count] = await this.categoryRepository.findAndCount();
      return {
        data: category,
        count,
      };
    } catch (error) {
      console.error('Fetch Category Error:', error);
      throw new InternalServerErrorException('Failed to fetch category.');
    }
  }
}
