// src/modules/customerBill/customerBill.controller.ts
import {
  Controller,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CreateCustomerBillDto } from './dto/customer-bill.dto';
import { CustomerBillService } from './customerBill.service';
import {
  CustomerBillTransformService,
  FrontendInvoiceData,
} from './customerBill-transform.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Uncomment if you have authentication

@Controller('customer-bills')
// @UseGuards(JwtAuthGuard) // Uncomment if you have authentication
export class CustomerBillController {
  constructor(
    private readonly customerBillService: CustomerBillService,
    private readonly transformService: CustomerBillTransformService,
  ) {}

  /**
   * Create a new customer bill (supports both frontend and backend formats)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateCustomerBillDto | FrontendInvoiceData,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.user_id || 1; // Get user ID from JWT or use default for testing

      let createDto: CreateCustomerBillDto;

      // Check if this is frontend data format
      if (this.isFrontendFormat(body)) {
        // Validate frontend data
        const validation = this.transformService.validateFrontendData(
          body as FrontendInvoiceData,
        );
        if (!validation.isValid) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: validation.errors,
          });
        }

        // Transform frontend data to backend DTO
        createDto = this.transformService.transformFrontendToDto(
          body as FrontendInvoiceData,
        );
      } else {
        // Use backend DTO directly
        createDto = body as CreateCustomerBillDto;
      }

      const result = await this.customerBillService.createCustomerBill(
        createDto,
        userId,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Customer bill created successfully',
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create customer bill specifically for frontend (alternative endpoint)
   */
  @Post('frontend')
  @HttpCode(HttpStatus.CREATED)
  async createFromFrontend(
    @Body() frontendData: FrontendInvoiceData,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.user_id || 1;

      // Validate frontend data
      const validation =
        this.transformService.validateFrontendData(frontendData);
      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      // Transform frontend data to backend DTO
      const createDto =
        this.transformService.transformFrontendToDto(frontendData);

      const result = await this.customerBillService.createCustomerBill(
        createDto,
        userId,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Customer bill created successfully',
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate frontend invoice data
   */
  @Post('validate')
  async validateInvoiceData(@Body() frontendData: FrontendInvoiceData) {
    try {
      const validation =
        this.transformService.validateFrontendData(frontendData);

      return {
        statusCode: HttpStatus.OK,
        message: validation.isValid ? 'Data is valid' : 'Validation failed',
        data: {
          isValid: validation.isValid,
          errors: validation.errors,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Helper method to detect if the body is in frontend format
   */
  private isFrontendFormat(body: any): boolean {
    // Check for frontend-specific properties
    return !!(
      body.invoiceNo ||
      body.selectedCustomer ||
      body.selectedSupplier ||
      body.supplier ||
      body.extraDiscount ||
      body.finalTotal ||
      (body.items && body.items.length > 0 && body.items[0].itemCode)
    );
  }
}
