export type Product = {
  id: number;
  sku: string;
  name: string;
  barcode: string | null;
  isActive: boolean;
  createdAtUtc: string;
};

export type CreateProductRequest = {
  sku: string;
  name: string;
  barcode: string | null;
};

export type UpdateProductRequest = {
  sku: string;
  name: string;
  barcode: string | null;
  isActive: boolean;
};