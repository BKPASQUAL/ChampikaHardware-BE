import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { Customer } from './customer.entity';
import { Business } from './business.entity';
import { UserRole } from '../enums/user-role.enum';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // Password field - should be hashed
  @Column({ type: 'varchar', length: 255 })
  password: string;

  // Status field to enable/disable users
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Business, (business) => business.users)
  business: Business;

  @Column({ nullable: true })
  businessId: number;

  @OneToMany(() => Customer, (customer) => customer.assignedRep)
  assignedCustomers: Customer[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}