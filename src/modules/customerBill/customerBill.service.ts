// src/modules/customerBill/customerBill.service.ts
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
} from '../../database/mysql/customer-bill.entity';
import { CustomerBillItem } from '../../database/mysql/customer-bill.entity';
import { Customer } from '../../database/mysql/customer.entity';
import { Item } from '../../database/mysql/item.entity';
import { Stock } from '../../database/mysql/stocks.entity';
import { StockLocation } from '../../database/mysql/stock_location.entity';
import { User } from '../../database/mysql/user.entity';
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
   * Find item by item code or ID
   */
  private async findItemByCodeOrId(itemData: any): Promise<Item> {
    let item: Item | null = null;

    // First try to find by item_id if provided
    if (itemData.item_id) {
      item = await this.itemRepository.findOne({
        where: { item_id: itemData.item_id },
        relations: ['category'],
      });
    }

    // If not found and itemCode is provided, try to find by item code
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

      // Generate invoice number if not provided
      const invoiceNo =
        createDto.invoiceNo || (await this.generateInvoiceNumber());

      // Calculate totals
      let subtotal = 0;
      let totalItems = 0;
      let totalQuantity = 0;

      // Prepare bill items
      const billItems: Partial<CustomerBillItem>[] = [];

      for (const itemDto of createDto.items) {
        // Find item by code or ID
        const item = await this.findItemByCodeOrId(itemDto);

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

        // Use provided unit_price or fall back to item selling_price
        const unitPrice = itemDto.unit_price || item.selling_price || 0;

        // Calculate item totals
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

      // Calculate bill totals using frontend values if provided
      const calculatedSubtotal = createDto.subtotal || subtotal;
      const extraDiscountPercent = createDto.extraDiscount || 0;
      const extraDiscountAmount =
        createDto.extraDiscountAmount ||
        (calculatedSubtotal * extraDiscountPercent) / 100;
      const finalTotal =
        createDto.finalTotal || calculatedSubtotal - extraDiscountAmount;

      // Create the customer bill
      const customerBillData = {
        invoice_no: invoiceNo,
        customer: customer,
        billing_date: createDto.billing_date || new Date(),
        payment_method: createDto.payment_method || PaymentMethod.CASH,
        status: createDto.status || BillStatus.DRAFT,
        subtotal: calculatedSubtotal,
        discount_percentage: extraDiscountPercent,
        discount_amount: extraDiscountAmount,
        tax_amount: 0,
        total_amount: finalTotal,
        paid_amount: 0,
        balance_amount: finalTotal,
        total_items: createDto.totalItems || totalItems,
        total_quantity: totalQuantity,
        notes: createDto.notes,
        reference_no: null,
        created_by: { user_id: userId } as User,
        location: location,
      };

      const savedBill = await queryRunner.manager.save(
        CustomerBill,
        queryRunner.manager.create(CustomerBill, customerBillData),
      );

      // Create bill items
      for (const itemData of billItems) {
        const billItem = queryRunner.manager.create(CustomerBillItem, {
          ...itemData,
          bill: savedBill,
        });
        await queryRunner.manager.save(CustomerBillItem, billItem);
      }

      // Update stock if location is specified
      if (location) {
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

      // Return the saved bill with relations
      const result = await this.customerBillRepository.findOne({
        where: { bill_id: savedBill.bill_id },
        relations: ['customer', 'items'],
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
}
