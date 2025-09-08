import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { StockTransfer } from './stock_transfers.entity';

@Entity('stock_transfer_items')
export class StockTransferItem {
  @PrimaryGeneratedColumn()
  transfer_item_id: number;

  @ManyToOne(() => StockTransfer, (transfer) => transfer.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transfer_id' })
  transfer: StockTransfer;

  @Column()
  item_id: number;

  @Column({ type: 'varchar', length: 50 })
  item_code: string; // Denormalized for quick access

  @Column({ type: 'varchar', length: 100 })
  item_name: string; // Denormalized for quick access

  @Column({ type: 'varchar', length: 100, nullable: true })
  supplier_name: string; // Denormalized for quick access

  @Column({ type: 'int' })
  requested_quantity: number;

  @Column({ type: 'int', nullable: true })
  shipped_quantity: number;

  @Column({ type: 'int', nullable: true })
  received_quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_cost: number; // At time of transfer

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_cost: number; // requested_quantity * unit_cost

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
