import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';
import { User } from './user.entity';

export enum CustomerType {
  RETAIL = 'retail',
  ENTERPRISE = 'enterprise',
}

@Entity('customer')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @Column({ type: 'varchar', length: 255 })
  shopName: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  customerCode: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.RETAIL,
  })
  customerType: CustomerType;

  @Column({ type: 'int', nullable: true })
  areaId: number | null;

  @ManyToOne(() => Area, (area) => area.customers, { nullable: true })
  @JoinColumn({ name: 'areaId', referencedColumnName: 'area_id' })
  area: Area | null;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 20 })
  contactNumber: string;

  // Foreign Key to User (Assigned Rep)
  @Column({ type: 'int', nullable: true })
  assignedRepId: number | null;

  @ManyToOne(() => User, (user) => user.assignedCustomers, { nullable: true })
  @JoinColumn({ name: 'assignedRepId', referencedColumnName: 'user_id' })
  assignedRep: User | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
