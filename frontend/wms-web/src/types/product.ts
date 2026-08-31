export type Product = {
  id: number;
  sku: string;
  name: string;
  barcode: string | null;
  minimumStock: number;
  isActive: boolean;
  createdAtUtc: string;
};

export type CreateProductRequest = {
  sku: string;
  name: string;
  barcode: string | null;
  minimumStock: number;
};

export type UpdateProductRequest = {
  sku: string;
  name: string;
  barcode: string | null;
  minimumStock: number;
  isActive: boolean;
};
