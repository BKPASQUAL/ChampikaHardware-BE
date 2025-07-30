import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/database/mysql/item.entity';
import { Repository } from 'typeorm';
import { CreateItemDto } from './dto/create-item.dto';
import { Supplier } from 'src/database/mysql/supplier.enitity';
import { Category } from 'src/database/mysql/category.entity';
import { ItemResponseDto } from './dto/item-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepositary: Repository<Item>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createItem(dto: CreateItemDto): Promise<ItemResponseDto> {
    try {
      const existing = await this.itemRepositary.findOne({
        where: {
          item_uuid: dto.item_uuid,
          item_name: dto.item_name,
          item_code: dto.item_code,
        },
      });

      if (existing) {
        throw new ConflictException (
          'Item already exists with same UUID, name, or code',
        );
      }

      const supplier = await this.supplierRepository.findOne({
        where: { supplier_id: dto.supplier_id },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }

      const category = await this.categoryRepository.findOne({
        where: { category_id: dto.category_id },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const newItem = this.itemRepositary.create({
        ...dto,
        item_uuid: uuidv4(),
        supplier,
        category,
      });

      const savedItem = await this.itemRepositary.save(newItem);

      return {
        item_uuid: savedItem.item_uuid,
        item_code: savedItem.item_code,
        item_name: savedItem.item_name,
        description: savedItem.description,
        cost_price: savedItem.cost_price,
        selling_price: savedItem.selling_price,
        // quantity: savedItem.quantity,
        sku: savedItem.sku,
        supplier_name: supplier.supplier_name,
        category_name: category.category_name,
      };
    } catch (error) {
      console.error('Error in Create Item Service:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      // Unknown error: wrap it
      throw new InternalServerErrorException('Failed to save item');
    }
  }
}
