import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SupplierBill } from './supplier-bill.entity';
import { Item } from './item.entity';

@Entity('supplier_bill_items')
export class SupplierBillItem {
  @PrimaryGeneratedColumn()
  supplier_bill_item_id: number;

  @ManyToOne(() => SupplierBill, bill => bill.billItems)
  @JoinColumn({ name: 'supplier_bill_id' })
  supplierBill: SupplierBill;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  @Column({ type: 'int', default: 0 })
  free_item_quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // calculated: (unit_price * quantity) - discount

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}