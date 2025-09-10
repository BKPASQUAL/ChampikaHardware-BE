import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('areas')
export class Area {
@PrimaryGeneratedColumn()
  area_id: number;

  @Column({ type: 'varchar', length: 100 })
  area_name: string;

  @OneToMany(() => Customer, customer => customer.area)
  customers: Customer[];
}
