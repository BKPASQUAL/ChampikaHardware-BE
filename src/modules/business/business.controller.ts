import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { Business } from 'src/database/mysql/business.entity';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // POST /business
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true })) // validates DTO
  async createBusiness(@Body() dto: CreateBusinessDto): Promise<Business> {
    return await this.businessService.createBusiness(dto);
  }

  // GET /business
  @Get()
  async getAllBusiness(): Promise<{ data: Business[] }> {
    return await this.businessService.getAllBusiness();
  }
}
