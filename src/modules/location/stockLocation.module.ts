import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockLocation } from 'src/database/mysql/stock_location.entity';
import { StockLocationController } from './stockLocation.controller';
import { StockLocationService } from './stockLocation.service';



@Module({
  imports: [TypeOrmModule.forFeature([StockLocation])],
  controllers: [StockLocationController],
  providers: [StockLocationService],
  exports: [StockLocationService],
})
export class StockLocationModule {}
