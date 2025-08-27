// supplier-bill.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { SupplierBillService } from './supplier-bill.service';
import { CreateSupplierBillDto } from './dto/create-supplier-bill.dto';

@Controller('supplier-bills')
export class SupplierBillController {
  constructor(private readonly supplierBillService: SupplierBillService) {}

  @Post()
  async create(@Body() createSupplierBillDto: CreateSupplierBillDto) {
    try {
      await this.supplierBillService.create(createSupplierBillDto);
      return {
        statusCode: 200,
        message: 'Supplier bill created successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create supplier bill',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
