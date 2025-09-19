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
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { StockLocation } from './stock_location.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
}

export enum BillStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  CANCELLED = 'cancelled',
}

@Entity('customer_bills')
export class CustomerBill {
  @PrimaryGeneratedColumn()
  bill_id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoice_no: string; // e.g., INV-240001

  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'date' })
  billing_date: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  payment_method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: BillStatus,
    default: BillStatus.DRAFT,
  })
  status: BillStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance_amount: number;

  @Column({ type: 'int', default: 0 })
  total_items: number;

  @Column({ type: 'int', default: 0 })
  total_quantity: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference_no: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @ManyToOne(() => StockLocation, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: StockLocation;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => CustomerBillItem, (item) => item.bill, {
    cascade: true,
    eager: true,
  })
  items: CustomerBillItem[];
}

@Entity('customer_bill_items')
export class CustomerBillItem {
  @PrimaryGeneratedColumn()
  bill_item_id: number;

  @ManyToOne(() => CustomerBill, (bill) => bill.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_id' })
  bill: CustomerBill;

  @Column()
  item_id: number;

  @Column({ type: 'varchar', length: 50 })
  item_code: string;

  @Column({ type: 'varchar', length: 100 })
  item_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category_name?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar', length: 20 })
  unit_type: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  free_quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
