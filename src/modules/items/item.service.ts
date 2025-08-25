import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Item } from 'src/database/mysql/item.entity';
import { Category } from 'src/database/mysql/category.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { Supplier } from 'src/database/mysql/supplier.enitity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createItem(dto: CreateItemDto): Promise<ItemResponseDto> {
    try {
      // Check if item already exists by name or code
      const existingItem = await this.itemRepository.findOne({
        where: [{ item_name: dto.item_name }, { item_code: dto.item_code }],
      });

      if (existingItem) {
        throw new ConflictException(
          'Item already exists with the same name or code',
        );
      }

      // Validate supplier exists
      const supplier = await this.supplierRepository.findOne({
        where: { supplier_id: dto.supplier_id },
      });

      if (!supplier) {
        throw new NotFoundException(
          `Supplier with ID ${dto.supplier_id} not found`,
        );
      }

      // Validate category exists
      const category = await this.categoryRepository.findOne({
        where: { category_id: dto.category_id },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${dto.category_id} not found`,
        );
      }

      // Create new item
      const newItem = this.itemRepository.create({
        ...dto,
        item_uuid: uuidv4(),
        supplier,
        category,
      });

      const savedItem = await this.itemRepository.save(newItem);

      // Return formatted response
      return {
        item_uuid: savedItem.item_uuid,
        item_code: savedItem.item_code,
        item_name: savedItem.item_name,
        description: savedItem.description,
        cost_price: savedItem.cost_price,
        selling_price: savedItem.selling_price,
        unit_type: savedItem.unit_type, // 👈 THIS caused the error
        supplier_name: supplier.supplier_name,
        category_name: category.category_name,
      };
    } catch (error) {
      console.error('Error creating item:', error);

      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Handle unknown errors
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the item',
      );
    }
  }
}
