import { Supplier } from './../../database/mysql/supplier.enitity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}
