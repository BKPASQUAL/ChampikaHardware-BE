import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BusinessType } from '../enums/business-type.enum';
import { User } from './user.entity';

@Entity('business')
export class Business {
  @PrimaryGeneratedColumn()
  business_id: number;

  @Column({ type: 'varchar', length: 100 })
  business_name: string;

  @Column({ type: 'enum', enum: BusinessType })
  business_type: BusinessType;

  @OneToMany(() => User, (user) => user.business)
  users: User[];
}
