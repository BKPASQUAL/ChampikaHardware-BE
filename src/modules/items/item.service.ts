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

  private async generateItemCode(supplierName: string): Promise<string> {
    // Get first two letters of supplier name and convert to uppercase
    const prefix = supplierName.substring(0, 2).toUpperCase();

    // Find the highest existing item code with this prefix
    const existingItems = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.item_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('item.item_code', 'DESC')
      .getMany();

    let nextNumber = 1;

    if (existingItems.length > 0) {
      // Extract the number part from the latest item code
      const latestCode = existingItems[0].item_code;
      const numberPart = latestCode.substring(2); // Remove prefix
      const latestNumber = parseInt(numberPart, 10);

      if (!isNaN(latestNumber)) {
        nextNumber = latestNumber + 1;
      }
    }

    // Format number with leading zeros (3 digits)
    const formattedNumber = nextNumber.toString().padStart(3, '0');

    return `${prefix}${formattedNumber}`;
  }

  async createItem(dto: CreateItemDto): Promise<ItemResponseDto> {
    try {
      // Validate supplier exists first
      const supplier = await this.supplierRepository.findOne({
        where: { supplier_id: dto.supplier_id },
      });

      if (!supplier) {
        throw new NotFoundException(
          `Supplier with ID ${dto.supplier_id} not found`,
        );
      }

      // Generate item code based on supplier name
      const generatedItemCode = await this.generateItemCode(
        supplier.supplier_name,
      );

      // Check if item already exists by name (remove item_code check since it's auto-generated)
      const existingItem = await this.itemRepository.findOne({
        where: { item_name: dto.item_name },
      });

      if (existingItem) {
        throw new ConflictException('Item already exists with the same name');
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

      // Create new item with auto-generated code
      const newItem = this.itemRepository.create({
        ...dto,
        item_code: generatedItemCode, // Use auto-generated code
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
        additional_notes: savedItem.additional_notes,
        cost_price: savedItem.cost_price,
        selling_price: savedItem.selling_price,
        rep_commision: savedItem.rep_commision,
        minimum_selling_price: savedItem.minimum_selling_price,
        unit_type: savedItem.unit_type,
        unit_quantity: savedItem.unit_quantity,
        supplier_id: supplier.supplier_id,
        supplier_name: supplier.supplier_name,
        category_id: category.category_id,
        category_name: category.category_name,
        images: savedItem.images,
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

  async getAllItems(): Promise<ItemResponseDto[]> {
    try {
      const items = await this.itemRepository.find({
        relations: ['supplier', 'category'],
      });

      return items.map((item) => ({
        item_uuid: item.item_uuid,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        additional_notes: item.additional_notes,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        rep_commision: item.rep_commision,
        minimum_selling_price: item.minimum_selling_price,
        unit_type: item.unit_type,
        unit_quantity: item.unit_quantity,
        supplier_id: item.supplier.supplier_id,
        supplier_name: item.supplier.supplier_name,
        category_id: item.category.category_id,
        category_name: item.category.category_name,
        images: item.images,
      }));
    } catch (error) {
      console.error('Error fetching items:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while fetching items',
      );
    }
  }
}
