import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/database/mysql/category.entity';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { Item } from 'src/database/mysql/item.entity';
import { Supplier } from 'src/database/mysql/supplier.enitity';


@Module({
  imports: [TypeOrmModule.forFeature([Category,Item,Supplier])],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {} 
