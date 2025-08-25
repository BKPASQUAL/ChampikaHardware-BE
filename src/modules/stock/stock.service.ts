import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Stock } from 'src/database/mysql/stocks.entity';
import { Repository } from 'typeorm';
import { AddStockDto } from './dto/add-stock.dto';
import { Item } from 'src/database/mysql/item.entity';
import { StockLocation } from 'src/database/mysql/stock_location.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,

    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,

    @InjectRepository(StockLocation)
    private readonly locationRepository: Repository<StockLocation>,
  ) {}

 async addItemStock(dto: AddStockDto): Promise<Stock> {
  const item = await this.itemRepository.findOne({
    where: { item_id: dto.item_id },
  });
  const location = await this.locationRepository.findOne({
    where: { location_id: dto.location_id },
  });

  if (!item) {
    throw new NotFoundException('Item not found');
  }

  if (!location) {
    throw new NotFoundException('Stock location not found');
  }

  // ✅ Use primitive foreign key fields in `where` clause
  let stock = await this.stockRepository.findOne({
    where: {
      item_id: dto.item_id,
      location_id: dto.location_id,
    },
  });

  if (stock) {
    // ✅ Update existing quantity
    stock.quantity += dto.quantity;
  } else {
    // ✅ Create new stock with full entity references
    stock = this.stockRepository.create({
      item_id: dto.item_id,
      location_id: dto.location_id,
      quantity: dto.quantity,
    });
  }

  return await this.stockRepository.save(stock);
}


}
