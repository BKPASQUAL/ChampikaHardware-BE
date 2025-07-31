import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { Area } from 'src/database/mysql/area.entity';
import { Category } from 'src/database/mysql/category.entity';
import { Item } from 'src/database/mysql/item.entity';
import { Stock } from 'src/database/mysql/stocks.entity';
import { Supplier } from 'src/database/mysql/supplier.enitity';

config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Area, Supplier, Item, Category, Stock],
  synchronize: process.env.ENVIRONMENT !== 'prod',
};
