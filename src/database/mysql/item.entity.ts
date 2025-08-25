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
import { Category } from './category.entity';
import { UnitType } from '../enums/item-type.enum';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  item_id: number;

  @Column({ type: 'varchar', length: 255 })
  item_uuid: string;

  @Column({ type: 'varchar', length: 50 })
  item_code: string;

  @Column({ type: 'varchar', length: 100 })
  item_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  additional_notes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  selling_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rep_commision: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimum_selling_price: number;

  @Column({
    type: 'enum',
    enum: UnitType,
  })
  unit_type: UnitType; // ✅ now enum

  @Column({ type: 'decimal', precision: 10, scale: 1, default: 0 })
  unit_quantity: number;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
