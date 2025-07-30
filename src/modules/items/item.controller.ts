import { Item } from './../../database/mysql/item.entity';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}
  
  // Create Supplier
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
}
