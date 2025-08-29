import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { v4 as uuidv4 } from 'uuid';
import { Supplier } from './supplier.enitity';
import { SupplierBillItem } from './supplier-bill-item.entity';
import { StockLocation } from './stock_location.entity';

@Entity('supplier_bills')
export class SupplierBill {
  @PrimaryGeneratedColumn()
  supplier_bill_id: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  supplier_bill_uuid: string = uuidv4();

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => StockLocation, { nullable: false }) // ✅ each bill belongs to one location
  @JoinColumn({ name: 'location_id' })
  location: StockLocation;

  @Column({ type: 'varchar', length: 50, unique: true })
  bill_number: string;

  @Column({ type: 'date' })
  billing_date: Date;

  @Column({ type: 'date' })
  received_date: Date;

  // One bill can have many items
  @OneToMany(() => SupplierBillItem, (billItem) => billItem.supplierBill, {
    cascade: true,
  })
  billItems: SupplierBillItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  extra_discount_percentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  final_total: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
