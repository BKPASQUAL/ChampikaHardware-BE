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
} from '../../database/mysql/customer-bill.entity';
import { CustomerBillItem } from '../../database/mysql/customer-bill.entity';
import { Customer } from '../../database/mysql/customer.entity';
import { Item } from '../../database/mysql/item.entity';
import { Stock } from '../../database/mysql/stocks.entity';
import { StockLocation } from '../../database/mysql/stock_location.entity';
import {
  CreateCustomerBillDto,
  UpdateCustomerBillDto,
} from './dto/customer-bill.dto';

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
    private dataSource: DataSource,
  ) {}

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Get the last invoice number for this month
    const lastInvoice = await this.customerBillRepository
      .createQueryBuilder('bill')
      .where('bill.invoice_no LIKE :pattern', {
        pattern: `INV-${year}${month}%`,
      })
      .orderBy('bill.invoice_no', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoice_no.slice(-4));
      sequence = lastSequence + 1;
    }

    return `INV-${year}${month}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create a new customer bill
   */
  async createCustomerBill(
    createDto: CreateCustomerBillDto,
    userId: number,
  ): Promise<CustomerBill> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
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

      // Generate invoice number
      const invoiceNo = await this.generateInvoiceNumber();

      // Calculate totals
      let subtotal = 0;
      let totalItems = 0;
      let totalQuantity = 0;

      // Prepare bill items
      const billItems: Partial<CustomerBillItem>[] = [];

      for (const itemDto of createDto.items) {
        // Validate item
        const item = await this.itemRepository.findOne({
          where: { item_id: itemDto.item_id },
          relations: ['category'],
        });

        if (!item) {
          throw new NotFoundException(
            `Item with ID ${itemDto.item_id} not found`,
          );
        }

        // Check stock availability if location is specified
        if (location) {
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

        // Calculate item totals
        const itemSubtotal = itemDto.unit_price * itemDto.quantity;
        const discountPercent = itemDto.discount_percentage || 0;
        const discountAmount = (itemSubtotal * discountPercent) / 100;
        const itemTotal = itemSubtotal - discountAmount;

        const categoryName = item.category?.category_name;

        billItems.push({
          item_id: item.item_id,
          item_code: item.item_code,
          item_name: item.item_name,
          category_name: categoryName || undefined,
          unit_price: itemDto.unit_price,
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
      const discountAmount =
        (subtotal * (createDto.discount_percentage || 0)) / 100;
      const totalAmount =
        subtotal - discountAmount + (createDto.tax_amount || 0);

      // Create the bill object
      const billData: Partial<CustomerBill> = {
        invoice_no: invoiceNo,
        customer: customer,
        billing_date: createDto.billing_date || new Date(),
        payment_method: createDto.payment_method,
        status: createDto.status || BillStatus.DRAFT,
        subtotal: subtotal,
        discount_percentage: createDto.discount_percentage || 0,
        discount_amount: discountAmount,
        tax_amount: createDto.tax_amount || 0,
        total_amount: totalAmount,
        paid_amount: createDto.paid_amount || 0,
        balance_amount: totalAmount - (createDto.paid_amount || 0),
        total_items: totalItems,
        total_quantity: totalQuantity,
        notes: createDto.notes || undefined,
        reference_no: createDto.reference_no || undefined,
        created_by: { user_id: userId } as any,
        location: location || undefined,
      };

      const bill = this.customerBillRepository.create(billData);
      const savedBill = await queryRunner.manager.save(CustomerBill, bill);

      // Create bill items
      for (const itemData of billItems) {
        const billItem = this.customerBillItemRepository.create({
          ...itemData,
          bill: savedBill,
        } as CustomerBillItem);
        await queryRunner.manager.save(CustomerBillItem, billItem);
      }

      // Update stock if bill is confirmed and location is specified
      if (createDto.status === BillStatus.PAID && location) {
        for (const itemDto of createDto.items) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Stock)
            .set({ quantity: () => `quantity - ${itemDto.quantity}` })
            .where('item_id = :itemId AND location_id = :locationId', {
              itemId: itemDto.item_id,
              locationId: location.location_id,
            })
            .execute();
        }
      }

      await queryRunner.commitTransaction();

      // Return the complete bill with items
      return this.findOne(savedBill.bill_id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all bills with optional filters
   */
  async findAll(filters?: {
    customer_id?: number;
    status?: BillStatus;
    from_date?: Date;
    to_date?: Date;
    location_id?: number;
  }): Promise<CustomerBill[]> {
    const query = this.customerBillRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('bill.items', 'items')
      .leftJoinAndSelect('bill.location', 'location')
      .leftJoinAndSelect('bill.created_by', 'user');

    if (filters?.customer_id) {
      query.andWhere('bill.customer_id = :customerId', {
        customerId: filters.customer_id,
      });
    }

    if (filters?.status) {
      query.andWhere('bill.status = :status', { status: filters.status });
    }

    if (filters?.from_date) {
      query.andWhere('bill.billing_date >= :fromDate', {
        fromDate: filters.from_date,
      });
    }

    if (filters?.to_date) {
      query.andWhere('bill.billing_date <= :toDate', {
        toDate: filters.to_date,
      });
    }

    if (filters?.location_id) {
      query.andWhere('bill.location_id = :locationId', {
        locationId: filters.location_id,
      });
    }

    return query.orderBy('bill.created_at', 'DESC').getMany();
  }

  /**
   * Find a single bill by ID
   */
  async findOne(id: number): Promise<CustomerBill> {
    const bill = await this.customerBillRepository.findOne({
      where: { bill_id: id },
      relations: ['customer', 'items', 'location', 'created_by'],
    });

    if (!bill) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }

    return bill;
  }

  /**
   * Update an existing bill
   */
  async update(
    id: number,
    updateDto: UpdateCustomerBillDto,
  ): Promise<CustomerBill> {
    const existingBill = await this.findOne(id);

    if (existingBill.status === BillStatus.PAID) {
      throw new BadRequestException('Cannot update a paid bill');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If items are being updated, recalculate totals
      if (updateDto.items) {
        // Delete existing items
        await queryRunner.manager.delete(CustomerBillItem, {
          bill: { bill_id: id },
        });

        // Add new items and recalculate
        let subtotal = 0;
        let totalItems = 0;
        let totalQuantity = 0;

        for (const itemDto of updateDto.items) {
          const item = await this.itemRepository.findOne({
            where: { item_id: itemDto.item_id },
            relations: ['category'],
          });

          if (!item) {
            throw new NotFoundException(
              `Item with ID ${itemDto.item_id} not found`,
            );
          }

          const itemSubtotal = itemDto.unit_price * itemDto.quantity;
          const discountPercent = itemDto.discount_percentage || 0;
          const discountAmount = (itemSubtotal * discountPercent) / 100;
          const itemTotal = itemSubtotal - discountAmount;

          const categoryName = item.category?.category_name;

          const billItemData: Partial<CustomerBillItem> = {
            bill: { bill_id: id } as CustomerBill,
            item_id: item.item_id,
            item_code: item.item_code,
            item_name: item.item_name,
            category_name: categoryName || undefined,
            unit_price: itemDto.unit_price,
            quantity: itemDto.quantity,
            unit_type: item.unit_type,
            discount_percentage: discountPercent,
            discount_amount: discountAmount,
            free_quantity: itemDto.free_quantity || 0,
            subtotal: itemSubtotal,
            total_amount: itemTotal,
            notes: itemDto.notes || undefined,
          };

          const billItem = this.customerBillItemRepository.create(
            billItemData as CustomerBillItem,
          );
          await queryRunner.manager.save(CustomerBillItem, billItem);

          subtotal += itemTotal;
          totalItems += 1;
          totalQuantity += itemDto.quantity;
        }

        updateDto.subtotal = subtotal;
        updateDto.total_items = totalItems;
        updateDto.total_quantity = totalQuantity;
      }

      // Recalculate final totals if needed
      if (
        updateDto.subtotal !== undefined ||
        updateDto.discount_percentage !== undefined
      ) {
        const subtotal = updateDto.subtotal || existingBill.subtotal;
        const discountPercentage =
          updateDto.discount_percentage ?? existingBill.discount_percentage;
        const discountAmount = (subtotal * discountPercentage) / 100;
        const taxAmount = updateDto.tax_amount ?? existingBill.tax_amount;
        const totalAmount = subtotal - discountAmount + taxAmount;

        updateDto.discount_amount = discountAmount;
        updateDto.total_amount = totalAmount;
        updateDto.balance_amount =
          totalAmount - (updateDto.paid_amount || existingBill.paid_amount);
      }

      // Update the bill
      await queryRunner.manager.update(CustomerBill, id, updateDto);

      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update payment status
   */
  async updatePayment(id: number, paidAmount: number): Promise<CustomerBill> {
    const bill = await this.findOne(id);

    const totalPaid = bill.paid_amount + paidAmount;
    const balance = bill.total_amount - totalPaid;

    let status = bill.status;
    if (balance <= 0) {
      status = BillStatus.PAID;
    } else if (totalPaid > 0) {
      status = BillStatus.PARTIALLY_PAID;
    }

    await this.customerBillRepository.update(id, {
      paid_amount: totalPaid,
      balance_amount: balance,
      status: status,
    });

    return this.findOne(id);
  }

  /**
   * Cancel a bill
   */
  async cancelBill(id: number): Promise<CustomerBill> {
    const bill = await this.findOne(id);

    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid bill');
    }

    await this.customerBillRepository.update(id, {
      status: BillStatus.CANCELLED,
    });

    return this.findOne(id);
  }

  /**
   * Get bill summary statistics
   */
  async getBillSummary(
    customerId?: number,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<any> {
    const query = this.customerBillRepository.createQueryBuilder('bill');

    if (customerId) {
      query.where('bill.customer_id = :customerId', { customerId });
    }

    if (fromDate) {
      query.andWhere('bill.billing_date >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('bill.billing_date <= :toDate', { toDate });
    }

    const result = await query
      .select('COUNT(bill.bill_id)', 'totalBills')
      .addSelect('SUM(bill.total_amount)', 'totalAmount')
      .addSelect('SUM(bill.paid_amount)', 'totalPaid')
      .addSelect('SUM(bill.balance_amount)', 'totalBalance')
      .addSelect('AVG(bill.total_amount)', 'averageBillAmount')
      .getRawOne();

    const statusCounts = await query
      .select('bill.status', 'status')
      .addSelect('COUNT(bill.bill_id)', 'count')
      .groupBy('bill.status')
      .getRawMany();

    return {
      ...result,
      statusBreakdown: statusCounts,
    };
  }
}
