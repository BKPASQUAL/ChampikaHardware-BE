// supplier-bill.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/database/mysql/item.entity';
import { SupplierBillItem } from 'src/database/mysql/supplier-bill-item.entity';
import { SupplierBill } from 'src/database/mysql/supplier-bill.entity';
import { Supplier } from 'src/database/mysql/supplier.enitity';
import { Repository } from 'typeorm';
import { CreateSupplierBillDto } from './dto/create-supplier-bill.dto';

@Injectable()
export class SupplierBillService {
  constructor(
    @InjectRepository(SupplierBill)
    private supplierBillRepository: Repository<SupplierBill>,

    @InjectRepository(SupplierBillItem)
    private supplierBillItemRepository: Repository<SupplierBillItem>,

    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,

    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
  ) {}

  async create(
    createSupplierBillDto: CreateSupplierBillDto,
  ): Promise<SupplierBill> {
    // Verify supplier exists
    const supplier = await this.supplierRepository.findOne({
      where: { supplier_id: parseInt(createSupplierBillDto.supplierId) },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Get items by item code (since frontend uses item codes, not database IDs)
    const itemCodes = createSupplierBillDto.items.map((item) => item.itemCode);
    const items = await this.itemRepository.find({
      where: itemCodes.map((code) => ({ item_code: code })),
    });

    if (items.length !== itemCodes.length) {
      throw new NotFoundException('One or more items not found');
    }

    // Create the main bill
    const supplierBill = this.supplierBillRepository.create({
      supplier,
      bill_number: createSupplierBillDto.billNo,
      billing_date: new Date(createSupplierBillDto.billingDate),
      received_date: new Date(createSupplierBillDto.receivedDate),
      extra_discount_percentage:
        parseFloat(createSupplierBillDto.extraDiscount || '0') || 0,
      subtotal: createSupplierBillDto.subtotal,
      discount_amount: createSupplierBillDto.extraDiscountAmount,
      final_total: createSupplierBillDto.finalTotal,
    });

    // Create bill items first
    const billItems: SupplierBillItem[] = [];

    for (const itemDto of createSupplierBillDto.items) {
      const item = items.find((i) => i.item_code === itemDto.itemCode);

      if (!item) {
        throw new NotFoundException(
          `Item with code ${itemDto.itemCode} not found`,
        );
      }

      const billItem = this.supplierBillItemRepository.create({
        item,
        unit_price: itemDto.price,
        quantity: itemDto.quantity,
        discount_percentage: itemDto.discount || 0,
        free_item_quantity: itemDto.freeItemQuantity || 0,
        amount: itemDto.amount,
      });

      billItems.push(billItem);
    }

    // Assign bill items to the bill
    supplierBill.billItems = billItems;

    // Save the complete bill with items (cascade should save items too)
    const savedBill = await this.supplierBillRepository.save(supplierBill);

    return savedBill;
  }

  async findAll(): Promise<SupplierBill[]> {
    return this.supplierBillRepository.find({
      relations: ['supplier', 'billItems', 'billItems.item'],
    });
  }

  // Note: This method might need the correct primary key field name from your entity
  // Replace 'id' with the actual field name (e.g., 'bill_id', 'supplier_bill_id', etc.)
  async findOne(id: number): Promise<SupplierBill> {
    const bill = await this.supplierBillRepository.findOne({
      where: { id: id } as any, // Temporary fix - replace with actual field name
      relations: ['supplier', 'billItems', 'billItems.item'],
    });

    if (!bill) {
      throw new NotFoundException('Supplier bill not found');
    }

    return bill;
  }
}
