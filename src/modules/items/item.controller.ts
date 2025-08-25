import { Item } from './../../database/mysql/item.entity';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}
  
  // Create Item
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateItemDto): Promise<any> {
    const item = await this.itemService.createItem(dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Item created successfully',
      data: item,
    };
  }

  // Get All Items
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<any> {
    const items = await this.itemService.getAllItems();

    return {
      statusCode: HttpStatus.OK,
      message: 'Items retrieved successfully',
      data: items,
      count: items.length,
    };
  }
}