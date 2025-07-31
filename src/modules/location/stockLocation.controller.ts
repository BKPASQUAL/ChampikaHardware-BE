import { Controller, HttpCode, HttpStatus, Post, Body } from '@nestjs/common';
import { StockLocationService } from './stockLocation.service';
import { CreateStockLocationDto } from './dto/create-stock-location.dto';

@Controller('stock-location')
export class StockLocationController {
  constructor(private readonly stockLocationService: StockLocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createStockLocationDto: CreateStockLocationDto,
  ): Promise<any> {
    const location = await this.stockLocationService.createLocation(
      createStockLocationDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Location created successfully',
      data: location,
    };
  }
}
