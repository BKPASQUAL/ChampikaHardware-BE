// src/modules/customerBill/customerBill.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CustomerBill,
  CustomerBillItem,
} from 'src/database/mysql/customer-bill.entity';
import { Customer } from 'src/database/mysql/customer.entity';
import { Item } from 'src/database/mysql/item.entity';
import { StockLocation } from 'src/database/mysql/stock_location.entity';
import { Stock } from 'src/database/mysql/stocks.entity';
import { CustomerBillController } from './customerBill.controller';
import { CustomerBillService } from './customerBill.service';
import { CustomerBillTransformService } from './customerBill-transform.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerBill,
      CustomerBillItem,
      Customer,
      Item,
      Stock,
      StockLocation,
    ]),
  ],
  controllers: [CustomerBillController],
  providers: [CustomerBillService, CustomerBillTransformService],
  exports: [CustomerBillService],
})
export class CustomerBillModule {}
