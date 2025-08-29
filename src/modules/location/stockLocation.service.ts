// import {
//   Injectable,
//   ConflictException,
//   HttpException,
//   InternalServerErrorException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { StockLocation } from 'src/database/mysql/stock_location.entity';
// import { Repository } from 'typeorm';
// import { CreateStockLocationDto } from './dto/create-stock-location.dto';
// import { v4 as uuidv4 } from 'uuid';

// @Injectable()
// export class StockLocationService {
//   constructor(
//     @InjectRepository(StockLocation)
//     private readonly stockLocationRepository: Repository<StockLocation>,
//   ) {}

//   async createLocation(dto: CreateStockLocationDto): Promise<StockLocation> {
//     try {
//       const existing = await this.stockLocationRepository.findOne({
//         where: {
//           location_name: dto.location_name,
//         },
//       });

//       if (existing) {
//         throw new ConflictException('Location with this name already exists');
//       }

//       const newLocation = this.stockLocationRepository.create({
//         ...dto,
//         location_uuid: uuidv4(),
//       });

//       return await this.stockLocationRepository.save(newLocation);
//     } catch (error) {
//       console.error('Error in Create Location Service:', error);

//       if (error instanceof HttpException) {
//         throw error;
//       }

//       throw new InternalServerErrorException('Failed to save location');
//     }
//   }
// }
