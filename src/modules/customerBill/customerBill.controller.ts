import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateCustomerBillDto,
  UpdateCustomerBillDto,
  UpdatePaymentDto,
  BillFilterDto,
} from './dto/customer-bill.dto';
import { CustomerBillService } from './customerBill.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Uncomment if you have authentication

@Controller('customer-bills')
// @UseGuards(JwtAuthGuard) // Uncomment if you have authentication
export class CustomerBillController {
  constructor(private readonly customerBillService: CustomerBillService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateCustomerBillDto,
    @Request() req: any,
  ) {
    const userId = req.user?.user_id || 1; // Get user ID from JWT or use default for testing
    return await this.customerBillService.createCustomerBill(createDto, userId);
  }

  @Get()
  async findAll(@Query() filters: BillFilterDto) {
    return await this.customerBillService.findAll(filters);
  }

  @Get('summary')
  async getSummary(
    @Query('customer_id') customerId?: number,
    @Query('from_date') fromDate?: Date,
    @Query('to_date') toDate?: Date,
  ) {
    return await this.customerBillService.getBillSummary(
      customerId,
      fromDate,
      toDate,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.customerBillService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdateCustomerBillDto,
  ) {
    return await this.customerBillService.update(id, updateDto);
  }

  @Post(':id/payment')
  async updatePayment(
    @Param('id') id: number,
    @Body() paymentDto: UpdatePaymentDto,
  ) {
    return await this.customerBillService.updatePayment(
      id,
      paymentDto.payment_amount,
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelBill(@Param('id') id: number) {
    return await this.customerBillService.cancelBill(id);
  }
}