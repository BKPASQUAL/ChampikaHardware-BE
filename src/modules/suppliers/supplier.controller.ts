import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Delete,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { Supplier } from 'src/database/mysql/supplier.enitity';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

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

  // Get All Suppliers
  @Get('dropdown')
  @HttpCode(HttpStatus.OK)
  async getDropDownData(): Promise<any> {
    try {
      const { data, count } = await this.supplierService.getDropDownSupplier();
      return {
        statusCode: HttpStatus.OK,
        message: 'Suppliers fetched successfully',
        data,
        count,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch suppliers for dropdown.',
      );
    }
  }
  // Get Supplier by ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id') id: string): Promise<any> {
    const supplier = await this.supplierService.getSupplierById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Supplier fetched successfully',
      data: supplier,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ): Promise<any> {
    const supplier = await this.supplierService.updateSupplier(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Supplier updated successfully',
      data: supplier,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<any> {
    await this.supplierService.deleteSupplier(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Supplier deleted successfully',
    };
  }
}
