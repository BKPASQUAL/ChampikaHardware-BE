import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Item } from './item.entity';
import { Category } from './category.entity';
import { StockLocation } from './stock_location.entity';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn()
  stock_id: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => StockLocation)
  @JoinColumn({ name: 'location_id' })
  category: StockLocation;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
