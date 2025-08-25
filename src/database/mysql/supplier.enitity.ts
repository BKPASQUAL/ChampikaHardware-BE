import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  supplier_id: number;

  @Column({ type: 'varchar', length: 36 })
  supplier_uuid: string;

  @Column({ type: 'varchar', length: 12 })
  supplier_code: string;

  @Column({ type: 'varchar', length: 100 })
  supplier_name: string;

  @Column({ type: 'text', nullable: true })
  additional_notes: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 20 })
  phone_number: string;

  @Column({ type: 'varchar', length: 100 })
  contact_person: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'int' })
  credit_days: number;

  // 🔗 Add relation to Category
  @ManyToOne(() => Category, { eager: true }) // eager loads category automatically
  @JoinColumn({ name: 'category_id' }) // FK column
  category: Category;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
