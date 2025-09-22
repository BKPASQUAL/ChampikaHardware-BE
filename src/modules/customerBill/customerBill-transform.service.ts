// src/modules/customerBill/customerBill-transform.service.ts
import { Injectable } from '@nestjs/common';
import { CreateCustomerBillDto, CustomerBillItemDto } from './dto/customer-bill.dto';
import { PaymentMethod, BillStatus } from '../../database/mysql/customer-bill.entity';

export interface FrontendInvoiceData {
  invoiceNo?: string;
  customer?: {
    value?: string | number;
    label?: string;
  };
  selectedCustomer?: string | number;
  supplier?: {
    value?: string | number;
    label?: string;
  };
  selectedSupplier?: string | number;
  billingDate?: Date | string;
  paymentMethod?: {
    value?: string;
    label?: string;
  };
  items: FrontendItemData[];
  subtotal?: number;
  extraDiscount?: number | string;
  extraDiscountAmount?: number;
  finalTotal?: number;
  totalItems?: number;
  notes?: string;
}

export interface FrontendItemData {
  id?: number;
  itemCode?: string;
  itemName?: string;
  price?: number | string;
  quantity?: number | string;
  unit?: string;
  discount?: number | string;
  freeItemQuantity?: number | string;
  amount?: number;
  category?: string;
}

@Injectable()
export class CustomerBillTransformService {
  
  /**
   * Transform frontend invoice data to backend DTO
   */
  transformFrontendToDto(frontendData: FrontendInvoiceData): CreateCustomerBillDto {
    // Extract customer ID from different possible frontend formats
    const customerId = this.extractCustomerId(frontendData);
    
    // Transform payment method
    const paymentMethod = this.transformPaymentMethod(frontendData.paymentMethod);
    
    // Transform items
    const items = this.transformItems(frontendData.items);
    
    // Transform billing date
    const billingDate = frontendData.billingDate 
      ? new Date(frontendData.billingDate) 
      : new Date();
    
    // Convert extraDiscount to number
    const extraDiscount = typeof frontendData.extraDiscount === 'string' 
      ? parseFloat(frontendData.extraDiscount) || 0
      : frontendData.extraDiscount || 0;

    const dto: CreateCustomerBillDto = {
      customer_id: customerId,
      invoiceNo: frontendData.invoiceNo,
      billing_date: billingDate,
      payment_method: paymentMethod,
      status: BillStatus.DRAFT,
      extraDiscount: extraDiscount,
      extraDiscountAmount: frontendData.extraDiscountAmount || 0,
      subtotal: frontendData.subtotal || 0,
      finalTotal: frontendData.finalTotal || 0,
      totalItems: frontendData.totalItems || items.length,
      notes: frontendData.notes,
      items: items,
    };

    return dto;
  }

  /**
   * Extract customer ID from various frontend formats
   */
  private extractCustomerId(frontendData: FrontendInvoiceData): number {
    // Try different possible locations for customer ID
    let customerId: string | number | undefined;

    if (frontendData.customer?.value) {
      customerId = frontendData.customer.value;
    } else if (frontendData.selectedCustomer) {
      customerId = frontendData.selectedCustomer;
    } else if (frontendData.supplier?.value) {
      // If frontend mistakenly uses 'supplier' for customer
      customerId = frontendData.supplier.value;
    } else if (frontendData.selectedSupplier) {
      // If frontend mistakenly uses 'selectedSupplier' for customer
      customerId = frontendData.selectedSupplier;
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // Convert to number
    const customerIdNum = typeof customerId === 'string' 
      ? parseInt(customerId, 10) 
      : customerId;

    if (isNaN(customerIdNum)) {
      throw new Error('Invalid customer ID format');
    }

    return customerIdNum;
  }

  /**
   * Transform payment method from frontend format
   */
  private transformPaymentMethod(paymentMethodData: any): PaymentMethod {
    if (!paymentMethodData) {
      return PaymentMethod.CASH; // Default
    }

    const paymentValue = paymentMethodData.value || paymentMethodData;
    
    // Map frontend payment method values to backend enum
    const paymentMethodMap: Record<string, PaymentMethod> = {
      'cash': PaymentMethod.CASH,
      'check': PaymentMethod.CHECK,
      'cheque': PaymentMethod.CHECK,
      'bank_transfer': PaymentMethod.BANK_TRANSFER,
      'bank-transfer': PaymentMethod.BANK_TRANSFER,
      'credit_card': PaymentMethod.CREDIT_CARD,
      'credit-card': PaymentMethod.CREDIT_CARD,
    };

    return paymentMethodMap[paymentValue?.toLowerCase()] || PaymentMethod.CASH;
  }

  /**
   * Transform frontend items to backend DTOs
   */
  private transformItems(frontendItems: FrontendItemData[]): CustomerBillItemDto[] {
    return frontendItems.map(item => this.transformSingleItem(item));
  }

  /**
   * Transform a single frontend item to backend DTO
   */
  private transformSingleItem(frontendItem: FrontendItemData): CustomerBillItemDto {
    // Convert string values to numbers
    const price = typeof frontendItem.price === 'string' 
      ? parseFloat(frontendItem.price) || 0
      : frontendItem.price || 0;
      
    const quantity = typeof frontendItem.quantity === 'string'
      ? parseFloat(frontendItem.quantity) || 0
      : frontendItem.quantity || 0;
      
    const discount = typeof frontendItem.discount === 'string'
      ? parseFloat(frontendItem.discount) || 0
      : frontendItem.discount || 0;
      
    const freeQuantity = typeof frontendItem.freeItemQuantity === 'string'
      ? parseFloat(frontendItem.freeItemQuantity) || 0
      : frontendItem.freeItemQuantity || 0;

    // Calculate amount if not provided
    const subtotal = price * quantity;
    const discountAmount = (subtotal * discount) / 100;
    const calculatedAmount = subtotal - discountAmount;

    const itemDto: CustomerBillItemDto = {
      item_id: frontendItem.id || 0, // This will be resolved by item code in service
      itemCode: frontendItem.itemCode,
      itemName: frontendItem.itemName,
      unit_price: price,
      quantity: quantity,
      unit: frontendItem.unit,
      discount_percentage: discount,
      free_quantity: freeQuantity,
      amount: frontendItem.amount || calculatedAmount,
      category: frontendItem.category,
    };

    return itemDto;
  }

  /**
   * Validate frontend data before transformation
   */
  validateFrontendData(frontendData: FrontendInvoiceData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if customer/supplier is selected
    if (!frontendData.customer?.value && 
        !frontendData.selectedCustomer && 
        !frontendData.supplier?.value && 
        !frontendData.selectedSupplier) {
      errors.push('Customer selection is required');
    }

    // Check if items exist
    if (!frontendData.items || frontendData.items.length === 0) {
      errors.push('At least one item is required');
    }

    // Validate each item
    frontendData.items?.forEach((item, index) => {
      if (!item.itemCode && !item.id) {
        errors.push(`Item ${index + 1}: Item code or ID is required`);
      }
      if (!item.itemName) {
        errors.push(`Item ${index + 1}: Item name is required`);
      }
      if (!item.price || parseFloat(item.price.toString()) <= 0) {
        errors.push(`Item ${index + 1}: Valid price is required`);
      }
      if (!item.quantity || parseFloat(item.quantity.toString()) <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}