// supplier-bill.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Supplier } from './supplier.enitity';
import { Item } from './item.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('supplier_bills')
export class SupplierBill {
  @PrimaryGeneratedColumn()
  supplier_bill_id: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  supplier_bill_uuid: string = uuidv4();

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  special_discount: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  free_item_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
