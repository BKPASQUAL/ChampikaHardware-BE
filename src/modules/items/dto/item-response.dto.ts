export class ItemResponseDto {
  item_uuid: string;
  item_code: string;
  item_name: string;
  description?: string;
  cost_price: number;
  selling_price: number;
  unit_type: string; // 👈 Add this property
  supplier_name: string;
  category_name: string;
}