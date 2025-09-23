import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ✅ Get all stocks
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

   @Get('dropdown')
  async getStocksDropdown() {
    try {
      const stocksDropdown = await this.stockService.getStocksDropdown();
      return {
        statusCode: HttpStatus.OK,
        message: 'Stocks dropdown retrieved successfully',
        data: stocksDropdown,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve stocks dropdown',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ✅ Create stock transfer
  @Post('transfers')
  async createStockTransfer(
    @Body() createStockTransferDto: CreateStockTransferDto,
    @Req() req: any, // assuming user is added by AuthGuard
  ) {
    try {
      const userId = req.user?.user_id || 1; // fallback if you don’t have auth yet
      const transfer = await this.stockService.createStockTransfer(
        createStockTransferDto,
        userId,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Stock transfer created successfully',
        data: transfer,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to create stock transfer',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
