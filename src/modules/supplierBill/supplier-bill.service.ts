// supplier-bill.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/database/mysql/item.entity';
import { SupplierBillItem } from 'src/database/mysql/supplier-bill-item.entity';
import { SupplierBill } from 'src/database/mysql/supplier-bill.entity';
import { Supplier } from 'src/database/mysql/supplier.enitity';
import { Repository } from 'typeorm';
import { CreateSupplierBillDto } from './dto/create-supplier-bill.dto';
import { StockLocation } from 'src/database/mysql/stock_location.entity';

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

    @InjectRepository(StockLocation)
    private locationRepository: Repository<StockLocation>, // Better naming
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

    const location = await this.locationRepository.findOne({
      where: { location_id: createSupplierBillDto.location_id }, // No parseInt needed
    });

    if (!location) {
      throw new NotFoundException('Location not found');
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
      location,
      bill_number: createSupplierBillDto.billNo,
      billing_date: new Date(createSupplierBillDto.billingDate),
      received_date: new Date(createSupplierBillDto.receivedDate),
      extra_discount_percentage:
        parseFloat(createSupplierBillDto.extraDiscount || '0') || 0,
      subtotal: createSupplierBillDto.subtotal,
      discount_amount: createSupplierBillDto.extraDiscountAmount,
      final_total: createSupplierBillDto.finalTotal,
    });

    // Create bill items and update item prices
    const billItems: SupplierBillItem[] = [];
    const itemsToUpdate: Item[] = [];

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

      // Update item prices based on supplier bill data
      let itemUpdated = false;

      // Update cost price (unit price from supplier bill becomes cost price)
      if (itemDto.price && item.cost_price !== itemDto.price) {
        item.cost_price = itemDto.price;
        itemUpdated = true;
      }

      // Update MRP if provided in the DTO
      if (itemDto.mrp && item.mrp !== itemDto.mrp) {
        item.mrp = itemDto.mrp;
        itemUpdated = true;
      }

      // Update selling price if provided in the DTO
      if (itemDto.sellingPrice && item.selling_price !== itemDto.sellingPrice) {
        item.selling_price = itemDto.sellingPrice;
        itemUpdated = true;
      }

      // Auto-calculate selling price if not provided (cost price + margin)
      // You can adjust this logic based on your business requirements
      if (!itemDto.sellingPrice && itemDto.price) {
        const marginPercentage = 20; // 20% margin - adjust as needed
        const calculatedSellingPrice =
          itemDto.price * (1 + marginPercentage / 100);

        if (item.selling_price !== calculatedSellingPrice) {
          item.selling_price = calculatedSellingPrice;
          itemUpdated = true;
        }
      }

      // Update last purchase date and supplier
      // item.last_purchase_date = new Date();
      // item.last_supplier_id = supplier.supplier_id;
      // itemUpdated = true;

      if (itemUpdated) {
        itemsToUpdate.push(item);
      }
    }

    // Assign bill items to the bill
    supplierBill.billItems = billItems;

    // Use transaction to ensure data consistency
    return await this.supplierBillRepository.manager.transaction(
      async (manager) => {
        // Save the complete bill with items
        const savedBill = await manager.save(SupplierBill, supplierBill);

        // Update all modified items
        if (itemsToUpdate.length > 0) {
          await manager.save(Item, itemsToUpdate);
        }

        return savedBill;
      },
    );
  }

  async findAll(): Promise<SupplierBill[]> {
    return this.supplierBillRepository.find({
      relations: ['supplier', 'billItems', 'billItems.item'],
    });
  }

  async findOne(id: number): Promise<SupplierBill> {
    const bill = await this.supplierBillRepository.findOne({
      where: { id: id } as any, // Replace with actual field name
      relations: ['supplier', 'billItems', 'billItems.item'],
    });

    if (!bill) {
      throw new NotFoundException('Supplier bill not found');
    }

    return bill;
  }

  // Helper method to update item prices separately if needed
  async updateItemPrices(
    itemCode: string,
    priceUpdates: {
      costPrice?: number;
      mrp?: number;
      sellingPrice?: number;
    },
  ): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { item_code: itemCode },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (priceUpdates.costPrice !== undefined) {
      item.cost_price = priceUpdates.costPrice;
    }

    if (priceUpdates.mrp !== undefined) {
      item.mrp = priceUpdates.mrp;
    }

    if (priceUpdates.sellingPrice !== undefined) {
      item.selling_price = priceUpdates.sellingPrice;
    }

    return await this.itemRepository.save(item);
  }
}
