import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  CustomerBill,
  BillStatus,
  PaymentMethod,
  OrderStatus,
} from '../../database/mysql/customer-bill.entity';
import { CustomerBillItem } from '../../database/mysql/customer-bill.entity';
import { Customer } from '../../database/mysql/customer.entity';
import { Item } from '../../database/mysql/item.entity';
import { Stock } from '../../database/mysql/stocks.entity';
import { StockLocation } from '../../database/mysql/stock_location.entity';
import { User } from '../../database/mysql/user.entity';
import { UserRole } from '../../database/enums/user-role.enum';
import { CreateCustomerBillDto } from './dto/customer-bill.dto';

@Injectable()
export class CustomerBillService {
  constructor(
    @InjectRepository(CustomerBill)
    private customerBillRepository: Repository<CustomerBill>,
    @InjectRepository(CustomerBillItem)
    private customerBillItemRepository: Repository<CustomerBillItem>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockLocation)
    private locationRepository: Repository<StockLocation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(
    isOrder: boolean = false,
  ): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const prefix = isOrder ? 'ORD' : 'INV';

    // Get the last invoice/order number for this month
    const lastInvoice = await this.customerBillRepository
      .createQueryBuilder('bill')
      .where('bill.invoice_no LIKE :pattern', {
        pattern: `${prefix}-${year}${month}%`,
      })
      .orderBy('bill.invoice_no', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoice_no.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}-${year}${month}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Find item by item code or ID
   */
  private async findItemByCodeOrId(itemData: any): Promise<Item> {
    let item: Item | null = null;

    if (itemData.item_id) {
      item = await this.itemRepository.findOne({
        where: { item_id: itemData.item_id },
        relations: ['category'],
      });
    }

    if (!item && itemData.itemCode) {
      item = await this.itemRepository.findOne({
        where: { item_code: itemData.itemCode },
        relations: ['category'],
      });
    }

    if (!item) {
      throw new NotFoundException(
        `Item not found with ${itemData.item_id ? `ID ${itemData.item_id}` : `code ${itemData.itemCode}`}`,
      );
    }

    return item;
  }

  /**
   * Create a new customer bill with role-based logic
   */
  async createCustomerBill(
    createDto: CreateCustomerBillDto,
    userId: number,
  ): Promise<CustomerBill> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get the user who is creating the bill
      const user = await this.userRepository.findOne({
        where: { user_id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Determine if this is an order based on user role
      const isOrder = user.role === UserRole.REPRESENTATIVE;

      // Validate customer
      const customer = await this.customerRepository.findOne({
        where: { id: createDto.customer_id },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Validate location if provided
      let location: StockLocation | null = null;
      if (createDto.location_id) {
        const foundLocation = await this.locationRepository.findOne({
          where: { location_id: createDto.location_id },
        });
        if (!foundLocation) {
          throw new NotFoundException('Location not found');
        }
        location = foundLocation;
      }

      // Generate invoice/order number if not provided
      const invoiceNo =
        createDto.invoiceNo || (await this.generateInvoiceNumber(isOrder));

      // Calculate totals
      let subtotal = 0;
      let totalItems = 0;
      let totalQuantity = 0;

      // Prepare bill items
      const billItems: Partial<CustomerBillItem>[] = [];

      for (const itemDto of createDto.items) {
        const item = await this.findItemByCodeOrId(itemDto);

        // For orders (representatives), we don't reduce stock immediately
        // Stock will be reduced when the order is confirmed by admin/manager
        if (!isOrder && location) {
          // Only check and reduce stock for direct bills (non-orders)
          const stock = await this.stockRepository.findOne({
            where: {
              item_id: item.item_id,
              location: { location_id: location.location_id },
            },
          });

          if (!stock || stock.quantity < itemDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for item ${item.item_name}. Available: ${stock?.quantity || 0}, Requested: ${itemDto.quantity}`,
            );
          }
        }

        const unitPrice = itemDto.unit_price || item.selling_price || 0;
        const itemSubtotal = unitPrice * itemDto.quantity;
        const discountPercent = itemDto.discount_percentage || 0;
        const discountAmount = (itemSubtotal * discountPercent) / 100;
        const itemTotal = itemSubtotal - discountAmount;

        const categoryName = item.category?.category_name;

        billItems.push({
          item_id: item.item_id,
          item_code: item.item_code,
          item_name: item.item_name,
          category_name: categoryName || undefined,
          unit_price: unitPrice,
          quantity: itemDto.quantity,
          unit_type: item.unit_type,
          discount_percentage: discountPercent,
          discount_amount: discountAmount,
          free_quantity: itemDto.free_quantity || 0,
          subtotal: itemSubtotal,
          total_amount: itemTotal,
          notes: itemDto.notes || undefined,
        });

        subtotal += itemTotal;
        totalItems += 1;
        totalQuantity += itemDto.quantity;
      }

      // Calculate bill totals
      const calculatedSubtotal = createDto.subtotal || subtotal;
      const extraDiscountPercent = createDto.extraDiscount || 0;
      const extraDiscountAmount =
        createDto.extraDiscountAmount ||
        (calculatedSubtotal * extraDiscountPercent) / 100;
      const finalTotal =
        createDto.finalTotal || calculatedSubtotal - extraDiscountAmount;

      // Set initial status and order-specific fields
      let initialStatus = createDto.status || BillStatus.DRAFT;
      let orderStatus: OrderStatus | null = null;

      if (isOrder) {
        // For representatives, always create as PENDING order
        initialStatus = BillStatus.PENDING;
        orderStatus = OrderStatus.PENDING;
      }

      // Create the customer bill
      const customerBill = new CustomerBill();
      customerBill.invoice_no = invoiceNo;
      customerBill.customer = customer;
      customerBill.billing_date = createDto.billing_date || new Date();
      customerBill.payment_method =
        createDto.payment_method || PaymentMethod.CASH;
      customerBill.status = initialStatus;
      customerBill.is_order = isOrder;
      customerBill.order_status = orderStatus || undefined;
      customerBill.order_confirmed_at = undefined;
      customerBill.confirmed_by = undefined;
      customerBill.subtotal = calculatedSubtotal;
      customerBill.discount_percentage = extraDiscountPercent;
      customerBill.discount_amount = extraDiscountAmount;
      customerBill.tax_amount = 0;
      customerBill.total_amount = finalTotal;
      customerBill.paid_amount = 0;
      customerBill.balance_amount = finalTotal;
      customerBill.total_items = createDto.totalItems || totalItems;
      customerBill.total_quantity = totalQuantity;
      customerBill.notes = createDto.notes;
      customerBill.reference_no = null;
      customerBill.created_by = user;
      customerBill.location = location;

      const savedBill = await queryRunner.manager.save(customerBill);

      // Create bill items
      for (const itemData of billItems) {
        const billItem = queryRunner.manager.create(CustomerBillItem, {
          ...itemData,
          bill: savedBill,
        });
        await queryRunner.manager.save(CustomerBillItem, billItem);
      }

      // Only update stock for direct bills (not orders)
      if (!isOrder && location) {
        for (const itemDto of createDto.items) {
          const item = await this.findItemByCodeOrId(itemDto);

          await queryRunner.manager.decrement(
            Stock,
            {
              item_id: item.item_id,
              location: { location_id: location.location_id },
            },
            'quantity',
            itemDto.quantity,
          );
        }
      }

      await queryRunner.commitTransaction();

      // Return the saved bill with relations - FIX: Handle null case
      const result = await this.customerBillRepository.findOne({
        where: { bill_id: savedBill.bill_id },
        relations: ['customer', 'items', 'created_by', 'location'],
      });

      if (!result) {
        throw new NotFoundException('Failed to retrieve created customer bill');
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Confirm order (for admin/manager only)
   */
  async confirmOrder(billId: number, userId: number): Promise<CustomerBill> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get the user confirming the order
      const user = await this.userRepository.findOne({
        where: { user_id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Only admin and manager can confirm orders
      if (![UserRole.ADMIN].includes(user.role)) {
        throw new BadRequestException(
          'Only admin or manager can confirm orders',
        );
      }

      // Get the bill
      const bill = await this.customerBillRepository.findOne({
        where: { bill_id: billId },
        relations: ['items', 'location'],
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      if (!bill.is_order) {
        throw new BadRequestException('This is not an order');
      }

      if (bill.order_status !== OrderStatus.PENDING) {
        throw new BadRequestException('Order is not in pending status');
      }

      // Check and reduce stock
      if (bill.location) {
        for (const item of bill.items) {
          const stock = await this.stockRepository.findOne({
            where: {
              item_id: item.item_id,
              location: { location_id: bill.location.location_id },
            },
          });

          if (!stock || stock.quantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for item ${item.item_name}. Available: ${stock?.quantity || 0}, Required: ${item.quantity}`,
            );
          }

          // Reduce stock
          await queryRunner.manager.decrement(
            Stock,
            {
              item_id: item.item_id,
              location: { location_id: bill.location.location_id },
            },
            'quantity',
            item.quantity,
          );
        }
      }

      // Update bill status
      bill.order_status = OrderStatus.CONFIRMED;
      bill.order_confirmed_at = new Date();
      bill.confirmed_by = user;
      bill.status = BillStatus.PENDING;

      await queryRunner.manager.save(CustomerBill, bill);

      await queryRunner.commitTransaction();

      // Return updated bill - FIX: Handle null case
      const updatedBill = await this.customerBillRepository.findOne({
        where: { bill_id: billId },
        relations: [
          'customer',
          'items',
          'created_by',
          'confirmed_by',
          'location',
        ],
      });

      if (!updatedBill) {
        throw new NotFoundException('Failed to retrieve updated bill');
      }

      return updatedBill;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all orders (for admin/manager)
   */
  async getOrders(status?: OrderStatus): Promise<CustomerBill[]> {
    const queryBuilder = this.customerBillRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('bill.items', 'items')
      .leftJoinAndSelect('bill.created_by', 'created_by')
      .leftJoinAndSelect('bill.location', 'location')
      .where('bill.is_order = :isOrder', { isOrder: true })
      .orderBy('bill.created_at', 'DESC');

    if (status) {
      queryBuilder.andWhere('bill.order_status = :status', { status });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get orders by representative
   */
  async getOrdersByRepresentative(
    userId: number,
    status?: OrderStatus,
  ): Promise<CustomerBill[]> {
    const queryBuilder = this.customerBillRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('bill.items', 'items')
      .leftJoinAndSelect('bill.location', 'location')
      .where('bill.is_order = :isOrder', { isOrder: true })
      .andWhere('bill.created_by = :userId', { userId })
      .orderBy('bill.created_at', 'DESC');

    if (status) {
      queryBuilder.andWhere('bill.order_status = :status', { status });
    }

    return await queryBuilder.getMany();
  }
}
