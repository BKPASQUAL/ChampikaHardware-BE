// stock.controller.ts
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async getAllStocks() {
    try {
      const stocks = await this.stockService.getAllStocks();
      return {
        statusCode: HttpStatus.OK,
        message: 'Stocks retrieved successfully',
        data: stocks,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve stocks',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
