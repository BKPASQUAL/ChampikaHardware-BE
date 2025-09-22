import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateCustomerBillDto } from './dto/customer-bill.dto';
import { CustomerBillService } from './customerBill.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Uncomment if you have authentication

@Controller('customer-bills')
// @UseGuards(JwtAuthGuard) // Uncomment if you have authentication
export class CustomerBillController {
  constructor(private readonly customerBillService: CustomerBillService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCustomerBillDto, @Request() req: any) {
    const userId = req.user?.user_id || 1; // Get user ID from JWT or use default for testing
    return await this.customerBillService.createCustomerBill(createDto, userId);
  }
}
