import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindOptionsWhere } from 'typeorm';
import { CreateStockLocationDto } from './dto/create-stock-location.dto';
import { StockLocation } from 'src/database/mysql/stock_location.entity';

@Injectable()
export class StockLocationService {
  constructor(
    @InjectRepository(StockLocation)
    private readonly stockLocationRepository: Repository<StockLocation>,
  ) {}

  // ✅ Create new stock location
  async create(dto: CreateStockLocationDto): Promise<StockLocation> {
    // 1. Check uniqueness of code + name per business
    const duplicate = await this.stockLocationRepository.findOne({
      where: [
        {
          location_code: dto.location_code,
          business: { business_id: dto.business_id },
        },
        {
          location_name: dto.location_name,
          business: { business_id: dto.business_id },
        },
      ],
      relations: ['business'],
    });
    if (duplicate) {
      throw new BadRequestException(
        `Location code or name already exists for this business`,
      );
    }

    // 2. Check only one main location per business
    if (dto.main) {
      const existingMain = await this.stockLocationRepository.findOne({
        where: { business: { business_id: dto.business_id }, main: true },
      });
      if (existingMain) {
        throw new BadRequestException(
          `This business already has a main location (ID: ${existingMain.location_id})`,
        );
      }
    }

    const location = this.stockLocationRepository.create({
      location_code: dto.location_code,
      location_name: dto.location_name,
      main: dto.main ?? false,
      business: { business_id: dto.business_id } as any,
      responsibleUser: dto.responsible_user_id
        ? ({ user_id: dto.responsible_user_id } as any)
        : null,
      parentLocation: dto.parent_location_id
        ? ({ location_id: dto.parent_location_id } as any)
        : null,
    });

    return await this.stockLocationRepository.save(location);
  }

  // ✅ Get all stock locations
  async findAll(): Promise<StockLocation[]> {
    return await this.stockLocationRepository.find({
      relations: [
        'business',
        'responsibleUser',
        'parentLocation',
        'subLocations',
      ],
    });
  }

  // ✅ Get all main locations
  async findAllMainLocations(): Promise<StockLocation[]> {
    return await this.stockLocationRepository.find({
      where: { main: true },
      relations: [
        'business',
        // 'responsibleUser',
        // 'parentLocation',
        // 'subLocations',
      ],
    });
  }

  // ✅ Get main location for a specific business
  async findMainLocationByBusiness(
    businessId: number,
  ): Promise<StockLocation | null> {
    return await this.stockLocationRepository.findOne({
      where: {
        main: true,
        business: { business_id: businessId },
      },
      relations: [
        'business',
        'responsibleUser',
        'parentLocation',
        'subLocations',
      ],
    });
  }

  // ✅ Get single stock location by ID
  async findOne(id: number): Promise<StockLocation> {
    const location = await this.stockLocationRepository.findOne({
      where: { location_id: id },
      relations: [
        'business',
        'responsibleUser',
        'parentLocation',
        'subLocations',
      ],
    });

    if (!location) {
      throw new NotFoundException(`Stock location with ID ${id} not found`);
    }
    return location;
  }

  // ✅ Update stock location
  async update(
    id: number,
    dto: Partial<CreateStockLocationDto>,
  ): Promise<StockLocation> {
    const location = await this.findOne(id);

    // 1. Check uniqueness of code + name (excluding current location)
    if (dto.location_code || dto.location_name) {
      const whereConditions: FindOptionsWhere<StockLocation>[] = [];

      if (dto.location_code) {
        whereConditions.push({
          location_code: dto.location_code,
          business: { business_id: location.business.business_id },
          location_id: Not(id),
        });
      }

      if (dto.location_name) {
        whereConditions.push({
          location_name: dto.location_name,
          business: { business_id: location.business.business_id },
          location_id: Not(id),
        });
      }

      const duplicate = await this.stockLocationRepository.findOne({
        where: whereConditions,
        relations: ['business'],
      });

      if (duplicate) {
        throw new BadRequestException(
          `Location code or name already exists for this business`,
        );
      }
    }

    // 2. Check main location constraint
    if (dto.main === true) {
      const existingMain = await this.stockLocationRepository.findOne({
        where: {
          business: { business_id: location.business.business_id },
          main: true,
        },
      });
      if (existingMain && existingMain.location_id !== id) {
        throw new BadRequestException(
          `This business already has a main location (ID: ${existingMain.location_id})`,
        );
      }
    }

    if (dto.location_code) location.location_code = dto.location_code;
    if (dto.location_name) location.location_name = dto.location_name;
    if (dto.main !== undefined) location.main = dto.main;
    if (dto.business_id)
      location.business = { business_id: dto.business_id } as any;
    if (dto.responsible_user_id)
      location.responsibleUser = { user_id: dto.responsible_user_id } as any;
    if (dto.parent_location_id)
      location.parentLocation = { location_id: dto.parent_location_id } as any;

    return await this.stockLocationRepository.save(location);
  }

  // ✅ Delete stock location
  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    await this.stockLocationRepository.remove(location);
  }
}
