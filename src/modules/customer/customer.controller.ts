import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Body,
  HttpException,
  HttpStatus,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  ParseIntPipe,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer-dto';
import { Customer } from 'src/database/mysql/customer.entity';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  /**
   * Create a new customer
   */
  @Post()
  async createCustomer(@Body() dto: CreateCustomerDto) {
    try {
      const customer: Customer = await this.customerService.createCustomer(dto);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Customer created successfully',
        data: customer,
      };
    } catch (error) {
      this.handleError(error, 'Failed to create customer');
    }
  }

  /**
   * Get all customers
   */
  @Get()
  async getAllCustomers() {
    try {
      const customers = await this.customerService.findAll();
      return {
        statusCode: HttpStatus.OK,
        message: 'Customers fetched successfully',
        data: customers,
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch customers');
    }
  }

  /**
   * Get a single customer by ID
   */
  @Get(':id')
  async getCustomer(@Param('id', ParseIntPipe) id: number) {
    try {
      const customer = await this.customerService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Customer fetched successfully',
        data: customer,
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch customer');
    }
  }

  /**
   * Update a customer
   */
  @Patch(':id')
  async updateCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCustomerDto>,
  ) {
    try {
      const updatedCustomer = await this.customerService.update(id, dto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Customer updated successfully',
        data: updatedCustomer,
      };
    } catch (error) {
      this.handleError(error, 'Failed to update customer');
    }
  }

  /**
   * Centralized error handler
   */
  private handleError(error: any, defaultMessage: string): never {
    if (error instanceof ConflictException) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: error.message,
          error: 'Conflict',
        },
        HttpStatus.CONFLICT,
      );
    }

    if (error instanceof BadRequestException) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: defaultMessage,
        error: error.message || 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
