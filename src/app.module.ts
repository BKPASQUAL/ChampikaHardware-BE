import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/mysql.config';
import { SupplierModule } from './modules/suppliers/supplier.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig),
    SupplierModule,
    CategoryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
