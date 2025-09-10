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

  // Foreign Key to Area
  @Column({ type: 'int' })
  areaId: number;

  @ManyToOne(() => Area, area => area.customers)
  @JoinColumn({ name: 'areaId', referencedColumnName: 'area_id' })
  area: Area;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 20 })
  contactNumber: string;

  // Foreign Key to User (Assigned Rep)
  @Column({ type: 'int' })
  assignedRepId: number;

  @ManyToOne(() => User, user => user.assignedCustomers)
  @JoinColumn({ name: 'assignedRepId', referencedColumnName: 'user_id' })
  assignedRep: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}