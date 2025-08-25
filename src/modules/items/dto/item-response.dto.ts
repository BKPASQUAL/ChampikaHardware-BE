// src/modules/items/dto/item-response.dto.ts
export class ItemResponseDto {
  item_uuid: string;
  item_code: string;
  item_name: string;
  description?: string;
  additional_notes?: string;
  cost_price: number;
  selling_price: number;
  rep_commision?: number;
  minimum_selling_price?: number;
  unit_type: string; // 👈 Enum stored as string (pcs, dz, etc.)
  unit_quantity?: number;
  supplier_id: number; // 👈 Keep IDs as well
  supplier_name: string; // 👈 Friendly name for supplier
  category_id: number;
  category_name: string; // 👈 Friendly name for category
  images?: string[];
}
