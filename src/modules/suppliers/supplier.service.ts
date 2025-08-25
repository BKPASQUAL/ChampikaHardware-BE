import { Supplier } from './../../database/mysql/supplier.enitity';
import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

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
        throw new ConflictException(
          'Supplier with this name or phone number already exists.',
        );
      }

      // ✅ Fix: provide `where: {}`
      const lastSupplier = await this.supplierRepository.findOne({
        where: {},
        order: { supplier_id: 'DESC' },
      });

      let newCode = 'S0001';
      if (lastSupplier) {
        const lastCode = lastSupplier.supplier_code; // e.g. "S0005"
        const lastNumber = parseInt(lastCode.replace('S', ''), 10);
        const nextNumber = lastNumber + 1;
        newCode = `S${nextNumber.toString().padStart(4, '0')}`;
      }

      const supplier = this.supplierRepository.create({
        ...dto,
        supplier_uuid: uuidv4(),
        supplier_code: newCode,
      });

      return await this.supplierRepository.save(supplier);
    } catch (error) {
      console.error('Create Supplier Error:', error);
      if (error instanceof HttpException) {
        throw error;
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

  async getDropDownSupplier(): Promise<{
    data: { supplier_id: number; supplier_name: string }[];
    count: number;
  }> {
    try {
      const [suppliers, count] = await this.supplierRepository.findAndCount({
        select: ['supplier_id', 'supplier_name'],
      });

      return {
        data: suppliers,
        count,
      };
    } catch (error) {
      console.error('Fetch Dropdown Supplier Error:', error);
      throw new InternalServerErrorException(
        'Failed to fetch suppliers for dropdown.',
      );
    }
  }

  async getSupplierById(supplier_uuid: string): Promise<Supplier> {
    try {
      const supplier = await this.supplierRepository.findOne({
        where: { supplier_uuid },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }

      return supplier;
    } catch (error) {
      console.error('Get Supplier By ID Error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve supplier');
    }
  }

  async updateSupplier(
    supplier_uuid: string,
    dto: UpdateSupplierDto,
  ): Promise<Supplier> {
    try {
      const supplier = await this.supplierRepository.findOne({
        where: { supplier_uuid },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }

      // Check for duplicate name or phone number from OTHER suppliers
      const existing = await this.supplierRepository.findOne({
        where: [
          { supplier_name: dto.supplier_name },
          { phone_number: dto.phone_number },
        ],
      });

      if (existing && existing.supplier_uuid !== supplier_uuid) {
        throw new ConflictException(
          'Another supplier with this name or phone number already exists.',
        );
      }

      const updated = Object.assign(supplier, dto);
      return await this.supplierRepository.save(updated);
    } catch (error) {
      console.error('Update Supplier Error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update supplier.');
    }
  }

  async deleteSupplier(supplier_uuid: string): Promise<void> {
    try {
      const result = await this.supplierRepository.delete({ supplier_uuid });

      if (result.affected === 0) {
        throw new NotFoundException('Supplier not found');
      }
    } catch (error) {
      console.error('Delete Supplier Error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete supplier.');
    }
  }
}
