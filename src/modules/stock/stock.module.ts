// stock.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { Stock } from 'src/database/mysql/stocks.entity';
import { Item } from 'src/database/mysql/item.entity';
import { Supplier } from 'src/database/mysql/supplier.enitity';
import { StockLocation } from 'src/database/mysql/stock_location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stock,
      Item,
      StockLocation,
      Supplier
    ])
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService]
})
export class StockModule {}