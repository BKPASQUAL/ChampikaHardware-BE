import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Business } from './business.entity';
import { UserLocationAccess } from './user_location_access.entity';

@Entity('location')
export class StockLocation {
  @PrimaryGeneratedColumn()
  location_id: number;

  @Column({ type: 'varchar', length: 50 })
  location_code: string;

  @Column({ type: 'varchar', length: 100 })
  location_name: string;

  @ManyToOne(() => Business, (business) => business.business_id, {
    nullable: false,
    onDelete: 'CASCADE', // ✅ delete locations if business is deleted
  })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser: User;

  @Column({ type: 'boolean', default: false }) // ✅ new field
  main: boolean;

  @ManyToOne(() => StockLocation, (location) => location.subLocations, {
    nullable: true,
    onDelete: 'CASCADE', // ✅ delete child locations if parent is deleted
  })
  @JoinColumn({ name: 'parent_location_id' })
  parentLocation: StockLocation;

  @OneToMany(() => StockLocation, (location) => location.parentLocation, {
    cascade: true,
  })
  subLocations: StockLocation[];

  @OneToMany(() => UserLocationAccess, (ula) => ula.location, {
    cascade: true,
    onDelete: 'CASCADE', // ✅ delete user access when location is deleted
  })
  userAccess: UserLocationAccess[];
}
