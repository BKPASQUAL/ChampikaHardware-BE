import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CustomerBillService } from './customerBill.service';
import {
  CustomerBillTransformService,
  FrontendInvoiceData,
} from './customerBill-transform.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import { UserRole } from '../../database/enums/user-role.enum';
import { OrderStatus } from '../../database/mysql/customer-bill.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('customer-bills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerBillController {
  constructor(
    private readonly customerBillService: CustomerBillService,
    private readonly transformService: CustomerBillTransformService,
  ) {}

  /**
   * Create a new customer bill or order
   * POST /customer-bills
   * - Representatives create orders (is_order = true)
   * - Admin/Manager create direct bills (is_order = false)
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.REPRESENTATIVE)
  async create(
    @Body() frontendData: FrontendInvoiceData,
    @CurrentUser() user: any,
  ) {
    // Validate frontend data
    const validation = this.transformService.validateFrontendData(frontendData);

    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      };
    }

    // Transform frontend data to DTO
    const createDto =
      this.transformService.transformFrontendToDto(frontendData);

    // Create bill/order
    const result = await this.customerBillService.createCustomerBill(
      createDto,
      user.user_id,
    );

    return {
      success: true,
      message: result.is_order
        ? 'Order created successfully. Awaiting confirmation.'
        : 'Customer bill created successfully',
      data: result,
    };
  }

  /**
   * Confirm an order (Admin/Manager only)
   * POST /customer-bills/:id/confirm
   */
  @Post(':id/confirm')
  @Roles(UserRole.ADMIN)
  async confirmOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.customerBillService.confirmOrder(
      id,
      user.user_id,
    );

    return {
      success: true,
      message: 'Order confirmed successfully',
      data: result,
    };
  }

  @Post(':id/checking')
  @Roles(UserRole.ADMIN, UserRole.OFFICE) // Allows Admin and Office roles
  async moveToChecking(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.customerBillService.moveToChecking(
      id,
      user.user_id,
    );

    return {
      success: true,
      message: 'Order status updated to Checking',
      data: result,
    };
  }

  /**
   * Get all orders (Admin/Manager)
   * GET /customer-bills/orders
   */
  @Get('orders')
  @Roles(UserRole.ADMIN)
  async getOrders(@Query('status') status?: OrderStatus) {
    const orders = await this.customerBillService.getOrders(status);

    return {
      success: true,
      data: orders,
      total: orders.length,
    };
  }

  /**
   * Get my orders (Representative)
   * GET /customer-bills/my-orders
   */
  @Get('my-orders')
  @Roles(UserRole.REPRESENTATIVE)
  async getMyOrders(
    @CurrentUser() user: any,
    @Query('status') status?: OrderStatus,
  ) {
    const orders = await this.customerBillService.getOrdersByRepresentative(
      user.user_id,
      status,
    );

    return {
      success: true,
      data: orders,
      total: orders.length,
    };
  }

  

  /**
   * Get a single bill/order by ID
   * GET /customer-bills/:id
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.REPRESENTATIVE)
  async getById(@Param('id', ParseIntPipe) id: number) {
    // Add method to service if not exists
    // const bill = await this.customerBillService.findById(id);

    return {
      success: true,
      // data: bill,
    };
  }

  /**
   * Get a single order by ID
   * GET /customer-bills/orders/:id
   */
  @Get('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.REPRESENTATIVE)
  async getOrderById(@Param('id', ParseIntPipe) id: number) {
    const order = await this.customerBillService.findOrderById(id);

    return {
      success: true,
      data: order,
    };
  }
}
