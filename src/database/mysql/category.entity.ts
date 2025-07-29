// category.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CategoryType } from '../enums/category-type.enum';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column({ type: 'varchar', length: 36 })
  category_uuid: string;

  @Column({ type: 'varchar', length: 100 })
  category_name: string;

  @Column({ type: 'varchar', length: 20 })
  category_code: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  category_type: CategoryType;
}
