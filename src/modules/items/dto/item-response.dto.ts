export class ItemResponseDto {
  item_uuid: string;
  item_code: string;
  item_name: string;
  description?: string;
  cost_price: number;
  selling_price: number;
//   quantity: number;
  sku: string;
  supplier_name: string;
  category_name: string;
}
