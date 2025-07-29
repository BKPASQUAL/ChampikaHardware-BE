import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { Supplier } from 'src/database/mysql/supplier.enitity';

@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  // Create Supplier
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSupplierDto): Promise<any> {
    const supplier = await this.supplierService.createSupplier(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Supplier created successfully',
      data: supplier,
    };
  }

  // Get All Suppliers
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(): Promise<any> {
    const { data, count } = await this.supplierService.getAllSupplier();
    return {
      statusCode: HttpStatus.OK,
      message: 'Suppliers fetched successfully',
      data,
      count,
    };
  }
}
