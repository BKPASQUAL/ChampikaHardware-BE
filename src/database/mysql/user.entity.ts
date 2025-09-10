import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({ type: 'varchar', length: 100 })
  role: string; // "admin", "rep", etc.

  @OneToMany(() => Customer, (customer) => customer.assignedRep)
  assignedCustomers: Customer[];
}
