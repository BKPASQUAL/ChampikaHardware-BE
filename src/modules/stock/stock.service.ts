// stock.service.ts
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Stock } from 'src/database/mysql/stocks.entity';
import { Repository, DataSource, Between } from 'typeorm';
import { StockTransfer } from 'src/database/mysql/stock_transfers.entity';
import { StockTransferItem } from 'src/database/mysql/stock_transfer_items.entity';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { User } from 'src/database/mysql/user.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(StockTransfer)
    private readonly stockTransferRepository: Repository<StockTransfer>,
    @InjectRepository(StockTransferItem)
    private readonly stockTransferItemRepository: Repository<StockTransferItem>,
    private readonly dataSource: DataSource,
  ) {}

  async getAllStocks() {
    try {
      return await this.stockRepository.find({
        relations: {
          item: { supplier: true },
          location: true,
        },
        select: {
          stock_id: true,
          quantity: true,
          updated_at: true,
          item_id: true, // ← ADDED: Include item_id in the response
          item: {
            item_code: true,
            item_name: true,
            supplier: {
              supplier_id: true,
              supplier_name: true,
            },
          },
          location: {
            location_id: true,
            location_code: true,
            location_name: true,
          },
        },
        order: {
          updated_at: 'DESC',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Database query failed: ${error.message}`,
      );
    }
  }

  /**
   * Create Stock Transfer and update stock levels
   */
  async createStockTransfer(createDto: CreateStockTransferDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Generate transfer number
      const transferNumber = await this.generateTransferNumber();

      // 2. Create transfer record
      const transfer = queryRunner.manager.create(StockTransfer, {
        transfer_number: transferNumber,
        sourceLocation: { location_id: createDto.source_location_id },
        destinationLocation: { location_id: createDto.destination_location_id },
        transfer_date: new Date(createDto.transfer_date),
        status: 'completed',
        createdBy: { user_id: userId } as User,
      });

      transfer.total_items = createDto.items.length;
      transfer.total_quantity = createDto.items.reduce(
        (sum, i) => sum + i.requested_quantity,
        0,
      );
      transfer.total_value = createDto.items.reduce(
        (sum, i) => sum + i.requested_quantity * (i.unit_cost || 0),
        0,
      );

      await queryRunner.manager.save(transfer);

      // 3. Loop through items
      for (const itemDto of createDto.items) {
        console.log('Processing item:', itemDto); // Debug log

        // a) Save transfer item
        const transferItem = queryRunner.manager.create(StockTransferItem, {
          transfer: { transfer_id: transfer.transfer_id },
          item_id: itemDto.item_id, // This should now have a value
          item_code: itemDto.item_code,
          item_name: itemDto.item_name,
          supplier_name: itemDto.supplier_name ?? undefined,
          requested_quantity: itemDto.requested_quantity,
          shipped_quantity: itemDto.requested_quantity,
          received_quantity: itemDto.requested_quantity,
          unit_cost: itemDto.unit_cost || 0,
          total_cost: itemDto.requested_quantity * (itemDto.unit_cost || 0),
        });

        await queryRunner.manager.save(transferItem);

        // b) Deduct from source location stock
        const sourceStock = await queryRunner.manager.findOne(Stock, {
          where: {
            item_id: itemDto.item_id, // Use the actual item_id
            location: { location_id: createDto.source_location_id },
          },
          relations: ['location', 'item'],
          lock: { mode: 'pessimistic_write' },
        });

        console.log('Source Stock Record:', sourceStock);
        console.log(`Checking stock for item ${itemDto.item_code}:`, {
          item_id: itemDto.item_id,
          source_location_id: createDto.source_location_id,
          requested_quantity: itemDto.requested_quantity,
          found_stock: sourceStock ? sourceStock.quantity : 'NO STOCK RECORD',
          stock_id: sourceStock ? sourceStock.stock_id : 'N/A',
          location_info: sourceStock?.location
            ? {
                location_id: sourceStock.location.location_id,
                location_name: sourceStock.location.location_name,
              }
            : 'No location loaded',
        });

        if (!sourceStock) {
          throw new BadRequestException(
            `No stock record found for item ${itemDto.item_code} (ID: ${itemDto.item_id}) at location ID ${createDto.source_location_id}.`,
          );
        }

        if (sourceStock.quantity < itemDto.requested_quantity) {
          throw new BadRequestException(
            `Insufficient stock for item ${itemDto.item_code}. Available: ${sourceStock.quantity}, Requested: ${itemDto.requested_quantity} at location ID ${createDto.source_location_id}.`,
          );
        }

        sourceStock.quantity -= itemDto.requested_quantity;
        await queryRunner.manager.save(sourceStock);

        // c) Add to destination location stock
        let destStock = await queryRunner.manager.findOne(Stock, {
          where: {
            item_id: itemDto.item_id, // Use the actual item_id
            location: { location_id: createDto.destination_location_id },
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!destStock) {
          destStock = queryRunner.manager.create(Stock, {
            item_id: itemDto.item_id, // Use the actual item_id
            location: { location_id: createDto.destination_location_id },
            quantity: 0,
          });
        }

        destStock.quantity += itemDto.requested_quantity;
        await queryRunner.manager.save(destStock);
      }

      // 4. Commit transaction
      await queryRunner.commitTransaction();

      return {
        message: 'Stock transfer created successfully',
        transfer_id: transfer.transfer_id,
        transfer_number: transfer.transfer_number,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Stock transfer error:', error); // Better error logging
      throw new InternalServerErrorException(
        `Failed to create stock transfer: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async generateTransferNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await this.stockTransferRepository.count({
      where: {
        transfer_date: Between(startOfDay, endOfDay),
      },
    });

    return `ST-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }
}
