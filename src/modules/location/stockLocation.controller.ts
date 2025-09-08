import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { StockLocationService } from './stockLocation.service';
import { CreateStockLocationDto } from './dto/create-stock-location.dto';

@Controller('stock-location')
export class StockLocationController {
  constructor(private readonly stockLocationService: StockLocationService) {}

  // ✅ Create new stock location
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createStockLocationDto: CreateStockLocationDto,
  ): Promise<any> {
    const location = await this.stockLocationService.create(
      createStockLocationDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Location created successfully',
      data: location,
    };
  }

  // ✅ Get all locations
  @Get()
  async findAll(): Promise<any> {
    const locations = await this.stockLocationService.findAll();
    return {
      statusCode: HttpStatus.OK,
      data: locations,
    };
  }

  // ✅ NEW: Get all locations with only ID and name
  @Get('dropdown')
  async findAllSimple(): Promise<any> {
    const locations = await this.stockLocationService.findAllSimple();
    return {
      statusCode: HttpStatus.OK,
      data: locations,
    };
  }

  // ✅ Get all main locations
  @Get('main')
  async findAllMainLocations(): Promise<any> {
    const locations = await this.stockLocationService.findAllMainLocations();
    return {
      statusCode: HttpStatus.OK,
      data: locations,
    };
  }

  // ✅ Get main location by business ID
  @Get('main/business/:businessId')
  async findMainLocationByBusiness(
    @Param('businessId', ParseIntPipe) businessId: number,
  ): Promise<any> {
    const location =
      await this.stockLocationService.findMainLocationByBusiness(businessId);
    return {
      statusCode: HttpStatus.OK,
      data: location,
    };
  }

  // ✅ Get single location by ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const location = await this.stockLocationService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      data: location,
    };
  }

  // ✅ Update location
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStockLocationDto: Partial<CreateStockLocationDto>,
  ): Promise<any> {
    const location = await this.stockLocationService.update(
      id,
      updateStockLocationDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Location updated successfully',
      data: location,
    };
  }

  // ✅ Delete location
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<any> {
    await this.stockLocationService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Location deleted successfully',
    };
  }
}
