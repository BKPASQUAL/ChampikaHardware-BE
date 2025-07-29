import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Supplier } from 'src/database/mysql/supplier.enitity';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    try {
      const existing = await this.supplierRepository.findOne({
        where: [
          { supplier_name: dto.supplier_name },
          { phone_number: dto.phone_number },
        ],
      });

      if (existing) {
        throw new BadRequestException(
          'Supplier with this name or phone number already exists.',
        );
      }

      const supplier = this.supplierRepository.create({
        ...dto,
        supplier_uuid: uuidv4(),
      });

      return await this.supplierRepository.save(supplier);
    } catch (error) {
      console.error('Create Supplier Error:', error);
      if (error instanceof HttpException) {
        throw error; // propagate known exceptions
      }
      throw new InternalServerErrorException('Failed to create supplier.');
    }
  }

  async getAllSupplier(): Promise<{ data: Supplier[]; count: number }> {
    try {
      const [suppliers, count] = await this.supplierRepository.findAndCount();
      return {
        data: suppliers,
        count,
      };
    } catch (error) {
      console.error('Fetch Supplier Error:', error);
      throw new InternalServerErrorException('Failed to fetch suppliers.');
    }
  }
}
