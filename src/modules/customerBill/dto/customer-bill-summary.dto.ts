// src/modules/customerBill/dto/customer-bill-summary.dto.ts
import { IsNumber, IsString } from 'class-validator';

export class CustomerBillSummaryDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  dueAmount: number;

  @IsNumber()
  pendingBillsCount: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  over45DaysAmount: number;

  @IsString()
  lastBillingDate: string;
}