import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from 'src/database/mysql/business.entity';
import { Repository } from 'typeorm';
import { CreateBusinessDto } from './dto/create-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async createBusiness(dto: CreateBusinessDto): Promise<Business> {
    const existing = await this.businessRepository.findOne({
      where: { business_name: dto.business_name },
    });

    if (existing) {
      throw new ConflictException('Business with this name already exists');
    }

    const business = this.businessRepository.create(dto);
    return await this.businessRepository.save(business);
  }
}
