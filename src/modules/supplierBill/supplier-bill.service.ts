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
import { Stock } from 'src/database/mysql/stocks.entity';

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
    private locationRepository: Repository<StockLocation>,

    @InjectRepository(Stock) // Add Stock repository
    private stockRepository: Repository<Stock>,
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
      where: { location_id: createSupplierBillDto.location_id },
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

    // Create bill items and prepare stock updates
    const billItems: SupplierBillItem[] = [];
    const itemsToUpdate: Item[] = [];
    const stockUpdates: {
      item: Item;
      quantityToAdd: number;
      freeQuantityToAdd: number;
    }[] = [];

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

      // Prepare stock update data
      stockUpdates.push({
        item,
        quantityToAdd: itemDto.quantity,
        freeQuantityToAdd: itemDto.freeItemQuantity || 0,
      });

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
      if (!itemDto.sellingPrice && itemDto.price) {
        const marginPercentage = 20; // 20% margin - adjust as needed
        const calculatedSellingPrice =
          itemDto.price * (1 + marginPercentage / 100);

        if (item.selling_price !== calculatedSellingPrice) {
          item.selling_price = calculatedSellingPrice;
          itemUpdated = true;
        }
      }

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

        // Update stock quantities
        await this.updateStockQuantities(manager, stockUpdates, location);

        return savedBill;
      },
    );
  }

  // Helper method to update stock quantities
  private async updateStockQuantities(
    manager: any,
    stockUpdates: {
      item: Item;
      quantityToAdd: number;
      freeQuantityToAdd: number;
    }[],
    location: StockLocation,
  ): Promise<void> {
    for (const stockUpdate of stockUpdates) {
      const { item, quantityToAdd, freeQuantityToAdd } = stockUpdate;
      const totalQuantityToAdd = quantityToAdd + freeQuantityToAdd;

      if (totalQuantityToAdd <= 0) {
        continue; // Skip if no quantity to add
      }

      // Check if stock record exists for this item and location
      let existingStock = await manager.findOne(Stock, {
        where: {
          item_id: item.item_id,
          location: { location_id: location.location_id },
        },
      });

      if (existingStock) {
        // Update existing stock
        existingStock.quantity += totalQuantityToAdd;
        await manager.save(Stock, existingStock);
      } else {
        // Create new stock record
        const newStock = manager.create(Stock, {
          item_id: item.item_id,
          item: item,
          location: location,
          quantity: totalQuantityToAdd,
        });
        await manager.save(Stock, newStock);
      }
    }
  }

  async findAll(): Promise<SupplierBill[]> {
    return this.supplierBillRepository.find({
      relations: ['supplier', 'billItems', 'billItems.item', 'location'],
    });
  }

  async findOne(id: number): Promise<SupplierBill> {
    const bill = await this.supplierBillRepository.findOne({
      where: { id: id } as any,
      relations: ['supplier', 'billItems', 'billItems.item', 'location'],
    });

    if (!bill) {
      throw new NotFoundException('Supplier bill not found');
    }

    return bill;
  }

  // Helper method to get stock levels for an item at a specific location
  async getStockLevel(itemId: number, locationId: number): Promise<number> {
    const stock = await this.stockRepository.findOne({
      where: {
        item_id: itemId,
        location: { location_id: locationId },
      },
    });

    return stock ? stock.quantity : 0;
  }

  // Helper method to get all stock levels for an item across all locations
  async getItemStockLevels(itemId: number): Promise<Stock[]> {
    return this.stockRepository.find({
      where: { item_id: itemId },
      relations: ['location'],
    });
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
