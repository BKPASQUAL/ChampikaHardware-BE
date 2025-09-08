// stock.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Stock } from 'src/database/mysql/stocks.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  async getAllStocks() {
    try {
      return await this.stockRepository.find({
        relations: {
          item: { supplier: true },
          location: true,
        },
        select: {
          stock_id: true,
          quantity: true,
          updated_at: true,
          item: {
            item_code: true,
            item_name: true,
            supplier: {
              supplier_id: true,
              supplier_name: true,
            },
          },
          location: {
            location_id: true,
            location_code: true,
            location_name: true,
          },
        },
        order: {
          updated_at: 'DESC',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Database query failed: ${error.message}`,
      );
    }
  }
}
