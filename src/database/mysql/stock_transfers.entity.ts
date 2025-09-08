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
import { User } from './user.entity';
import { StockLocation } from './stock_location.entity';
import { StockTransferItem } from './stock_transfer_items.entity';

// Main transfer record
@Entity('stock_transfers')
export class StockTransfer {
  @PrimaryGeneratedColumn()
  transfer_id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  transfer_number: string; // Auto-generated: ST-20250908-001

  @ManyToOne(() => StockLocation)
  @JoinColumn({ name: 'source_location_id' })
  sourceLocation: StockLocation;

  @ManyToOne(() => StockLocation)
  @JoinColumn({ name: 'destination_location_id' })
  destinationLocation: StockLocation;

  @Column({ type: 'date' })
  transfer_date: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'completed', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Column({ type: 'int', default: 0 })
  total_items: number;

  @Column({ type: 'int', default: 0 })
  total_quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_value: number; // For reporting purposes

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => StockTransferItem, (item) => item.transfer, {
    cascade: true,
  })
  items: StockTransferItem[];
}
