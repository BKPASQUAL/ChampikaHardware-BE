import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn()
  area_id: number;

  @Column({ length: 100 })
  area_name: string;
}
