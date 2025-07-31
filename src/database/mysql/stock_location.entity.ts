// stock-location.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stock_location')
export class StockLocation {
  @PrimaryGeneratedColumn()
  location_id: number;

  @Column({ type: 'varchar', length: 36 })
  location_uuid: string;

  @Column({ type: 'boolean', default: false })
  main: boolean;

  @Column({ type: 'varchar', length: 100 })
  location_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
