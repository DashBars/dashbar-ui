// Types extracted from backend Prisma schema and DTOs

export type BarType = 'VIP' | 'general' | 'backstage' | 'lounge';
export type BarStatus = 'open' | 'closed' | 'lowStock';
export type OwnershipMode = 'purchased' | 'consignment';
export type PosnetStatus = 'active' | 'inactive';

// Bar types
export interface Bar {
  id: number;
  name: string;
  type: BarType;
  status: BarStatus;
  eventId: number;
  stocks?: Stock[];
  posnets?: Posnet[];
}

export interface CreateBarDto {
  name: string;
  type: BarType;
  status?: BarStatus;
}

export interface UpdateBarDto {
  name?: string;
  type?: BarType;
  status?: BarStatus;
}

// Stock types
export interface Stock {
  barId: number;
  drinkId: number;
  supplierId: number;
  quantity: number;
  unitCost: number;
  currency: string;
  ownershipMode: OwnershipMode;
  receivedAt: string;
  drink?: Drink;
  supplier?: Supplier;
}

export interface StockSummary {
  drinkId: number;
  drinkName: string;
  drinkBrand: string;
  totalQuantity: number;
  supplierCount: number;
}

export interface UpsertStockDto {
  drinkId: number;
  supplierId: number;
  quantity: number;
  unitCost: number;
  currency?: string;
  ownershipMode: OwnershipMode;
}

export interface BulkUpsertStockDto {
  items: UpsertStockDto[];
}

export interface Drink {
  id: number;
  name: string;
  brand: string;
  sku: string;
  drinkType: 'alcoholic' | 'non_alcoholic';
  volume: number;
}

export interface CreateDrinkDto {
  name: string;
  brand: string;
  sku: string;
  drinkType: 'alcoholic' | 'non_alcoholic';
  volume: number;
}

export interface UpdateDrinkDto {
  name?: string;
  brand?: string;
  sku?: string;
  drinkType?: 'alcoholic' | 'non_alcoholic';
  volume?: number;
}

export interface Supplier {
  id: number;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  ownerId?: number;
}

export interface CreateSupplierDto {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
}

// Recipe Override types
export interface RecipeOverride {
  id: number;
  barId: number;
  cocktailId: number;
  drinkId: number;
  cocktailPercentage: number;
  cocktail?: Cocktail;
  drink?: Drink;
}

export interface CreateRecipeOverrideDto {
  cocktailId: number;
  drinkId: number;
  cocktailPercentage: number;
}

export interface UpdateRecipeOverrideDto {
  cocktailPercentage?: number;
}

export interface Cocktail {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  price: number;
  volume: number;
  isActive: boolean;
  isCombo: boolean;
}

// Posnet types
export interface Posnet {
  id: number;
  status: PosnetStatus;
  traffic: number;
  barId: number;
}

// Auth types
export type UserRole = 'manager' | 'cashier' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Consignment Return types
export interface ConsignmentReturnSummary {
  barId: number;
  barName: string;
  supplierId: number;
  supplierName: string;
  drinkId: number;
  drinkName: string;
  drinkSku: string;
  currentStockQuantity: number;
  totalReceived: number;
  totalConsumed: number;
  totalReturned: number;
  quantityToReturn: number;
}

export interface SupplierReturnSummary {
  supplierId: number;
  supplierName: string;
  items: ConsignmentReturnSummary[];
  totalToReturn: number;
}

export interface EventConsignmentSummary {
  eventId: number;
  eventName: string;
  bySupplier: SupplierReturnSummary[];
  grandTotal: number;
}

export interface ExecuteReturnResult {
  returnId: number;
  barId: number;
  drinkId: number;
  drinkSku: string;
  supplierId: number;
  quantityReturned: number;
  returnedAt: string;
  performedById: number;
}

// Inventory Movement types
export type MovementType = 'sale' | 'adjustment' | 'return_' | 'transfer';

export interface InventoryMovement {
  id: number;
  barId: number;
  drinkId: number;
  supplierId: number;
  quantity: number; // Negative for deductions, positive for additions
  type: MovementType;
  referenceId?: number;
  notes?: string;
  createdAt: string;
  drink?: Drink;
  supplier?: Supplier;
}

// Event types
export type EventStatus = 'upcoming' | 'active' | 'finished';

export interface Venue {
  id: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  ownerId?: number;
}

export interface CreateVenueDto {
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
}

export interface UpdateVenueDto {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  capacity?: number;
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  startedAt: string | null;
  finishedAt: string | null;
  stockDepletionPolicy: 'cheapest_first' | 'fifo' | 'consignment_last';
  ownerId: number;
  venueId: number;
  venue?: Venue;
}

export interface CreateEventDto {
  name: string;
  description?: string;
  venueId: number;
  startedAt?: string;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  venueId?: number;
  startedAt?: string;
}

// Manager Inventory types
export interface ManagerInventory {
  id: number;
  ownerId: number;
  drinkId: number;
  supplierId: number;
  totalQuantity: number;
  allocatedQuantity: number;
  unitCost: number;
  currency: string;
  sku?: string | null;
  receivedAt: string;
  drink: Drink;
  supplier: Supplier;
  allocations?: ManagerInventoryAllocation[];
}

export interface ManagerInventoryAllocation {
  id: number;
  managerInventoryId: number;
  eventId: number;
  barId: number;
  quantity: number;
  allocatedAt: string;
  event: Event;
  bar: Bar;
}

export interface CreateManagerInventoryDto {
  drinkId: number;
  supplierId: number;
  totalQuantity: number;
  unitCost: number;
  currency?: string;
  sku?: string;
}

export interface UpdateManagerInventoryDto {
  totalQuantity?: number;
  unitCost?: number;
  sku?: string;
}

export interface TransferToBarDto {
  eventId: number;
  barId: number;
  quantity: number;
}
