import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/mysql.config';
import { SupplierModule } from './modules/suppliers/supplier.module';
import { CategoryModule } from './modules/category/category.module';
import { ItemModule } from './modules/items/item.module';
import { StockLocationModule } from './modules/location/stockLocation.module';
import { SupplierBillModule } from './modules/supplierBill/supplier-bill.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    SupplierModule,
    CategoryModule,
    ItemModule,
    StockLocationModule,
    SupplierBillModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
