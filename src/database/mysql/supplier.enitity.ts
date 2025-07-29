import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  supplier_id: number;

  @Column({ type: 'varchar', length: 36 })
  supplier_uuid: string;

  @Column({ type: 'varchar', length: 100 })
  supplier_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 20 })
  phone_number: string;

  @Column({ type: 'varchar', length: 100 })
  representative_name: string;

  @Column({ type: 'varchar', length: 100 })
  representative_contact: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
