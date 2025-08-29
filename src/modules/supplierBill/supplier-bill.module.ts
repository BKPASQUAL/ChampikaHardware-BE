// supplier-bill.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SupplierBillController } from './supplier-bill.controller';
import { SupplierBillService } from './supplier-bill.service';
import { SupplierBill } from 'src/database/mysql/supplier-bill.entity';
import { Supplier } from 'src/database/mysql/supplier.enitity';
import { SupplierBillItem } from 'src/database/mysql/supplier-bill-item.entity';
import { Item } from 'src/database/mysql/item.entity';
import { StockLocation } from 'src/database/mysql/stock_location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierBill,
      SupplierBillItem,
      Supplier,
      Item,
      StockLocation,
    ]),
  ],
  controllers: [SupplierBillController],
  providers: [SupplierBillService],
  exports: [SupplierBillService],
})
export class SupplierBillModule {}
