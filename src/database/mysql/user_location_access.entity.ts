import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { StockLocation } from './stock_location.entity';

@Entity('user_location_access')
export class UserLocationAccess {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.user_id, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => StockLocation, (StockLocation) => StockLocation.userAccess, {
    nullable: false,
  })
  @JoinColumn({ name: 'location_id' })
  location: StockLocation;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  access_start: Date;

  @Column({ type: 'timestamp', nullable: true })
  access_end: Date; // null = still valid
}
