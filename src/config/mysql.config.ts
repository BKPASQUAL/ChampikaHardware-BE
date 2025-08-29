import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { Area } from 'src/database/mysql/area.entity';
import { Business } from 'src/database/mysql/business.entity';
import { Category } from 'src/database/mysql/category.entity';
import { Item } from 'src/database/mysql/item.entity';
import { StockLocation } from 'src/database/mysql/stock_location.entity';
import { Stock } from 'src/database/mysql/stocks.entity';
import { SupplierBillItem } from 'src/database/mysql/supplier-bill-item.entity';
import { SupplierBill } from 'src/database/mysql/supplier-bill.entity';
import { Supplier } from 'src/database/mysql/supplier.enitity';
import { User } from 'src/database/mysql/user.entity';
import { UserLocationAccess } from 'src/database/mysql/user_location_access.entity';

config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    Area,
    Supplier,
    Item,
    Category,
    Stock,
    SupplierBill,
    SupplierBillItem,
    User,
    UserLocationAccess,
    Business,
    StockLocation,
  ],
  synchronize: process.env.ENVIRONMENT !== 'prod',
};
