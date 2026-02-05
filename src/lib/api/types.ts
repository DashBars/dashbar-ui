// Types extracted from backend Prisma schema and DTOs

export type BarType = 'VIP' | 'general' | 'backstage' | 'lounge';
export type BarStatus = 'open' | 'closed' | 'lowStock';
export type OwnershipMode = 'purchased' | 'consignment';

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
  sellAsWholeUnit: boolean;
  salePrice?: number;
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

// Event/bar prices (event-level barId null, or per-bar override)
export interface EventPrice {
  id: number;
  eventId: number;
  cocktailId: number;
  barId: number | null;
  price: number; // cents
  cocktail?: Cocktail;
}

export interface CreatePriceDto {
  cocktailId: number;
  price: number; // cents
  barId?: number; // optional: per-bar override
}

export interface UpdatePriceDto {
  price: number; // cents
}

// Event-level recipes (per bar type)
export interface EventRecipe {
  id: number;
  eventId: number;
  cocktailName: string;
  glassVolume: number;
  hasIce: boolean;
  salePrice: number; // precio de venta en centavos
  barTypes: BarType[];
  components: Array<{
    id: number;
    drinkId: number;
    percentage: number;
    drink?: Drink;
  }>;
}

export interface RecipeComponentDto {
  drinkId: number;
  percentage: number;
}

export interface CreateRecipeDto {
  cocktailName: string;
  glassVolume: number;
  hasIce: boolean;
  salePrice: number;
  barTypes: BarType[];
  components: RecipeComponentDto[];
}

export interface UpdateRecipeDto {
  cocktailName?: string;
  glassVolume?: number;
  hasIce?: boolean;
  salePrice?: number;
  barTypes?: BarType[];
  components?: RecipeComponentDto[];
}

// Posnet types (POS Terminal)
export type PosnetStatus = 'OPEN' | 'CONGESTED' | 'CLOSED';
export type POSSaleStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'VOIDED';
export type POSPaymentMethod = 'cash' | 'card' | 'digital';

export interface Posnet {
  id: number;
  code: string;
  name: string;
  status: PosnetStatus;
  enabled: boolean;
  traffic: number;
  eventId: number;
  barId: number;
  lastHeartbeatAt?: string;
  createdAt: string;
  updatedAt: string;
  bar?: Bar;
  event?: Event;
}

export interface CreatePosnetDto {
  name: string;
  barId: number;
  code?: string;
}

export interface UpdatePosnetDto {
  name?: string;
  enabled?: boolean;
  status?: PosnetStatus;
}

export interface POSLoginResponse {
  accessToken: string;
  posnet: Posnet;
}

export interface POSSession {
  id: number;
  posnetId: number;
  openedById: number;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  notes?: string;
}

export interface POSSale {
  id: number;
  posnetId: number;
  sessionId?: number;
  eventId: number;
  barId: number;
  cashierId?: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: POSSaleStatus;
  idempotencyKey?: string;
  createdAt: string;
  completedAt?: string;
  items: POSSaleItem[];
  payments: POSPayment[];
}

export interface POSSaleItem {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface POSPayment {
  id: number;
  saleId: number;
  method: POSPaymentMethod;
  amount: number;
  reference?: string;
  status: 'SUCCESS' | 'FAILED';
  processedAt: string;
}

export interface POSConfig {
  posnet: Posnet;
  event: { id: number; name: string };
  bar: { id: number; name: string; type: string };
  products: POSProduct[];
  categories: string[];
  session?: POSSession;
}

export interface POSProductComponent {
  drinkId: number;
  drinkName: string;
  drinkBrand: string;
  percentage: number;
}

export interface POSProduct {
  id: number;
  name: string;
  price: number;
  category?: string;
  available: boolean;
  stockLevel?: number;
  imageUrl?: string;
  // Recipe details
  glassVolume?: number;
  hasIce?: boolean;
  components?: POSProductComponent[];
}

export interface CartItem {
  product: POSProduct;
  quantity: number;
}

export interface CreatePOSSaleDto {
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: POSPaymentMethod;
  paymentAmount?: number;
  idempotencyKey?: string;
}

export interface ReceiptData {
  saleId: number;
  receiptNumber: string;
  posnetName: string;
  barName: string;
  eventName: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: POSPaymentMethod;
  createdAt: string;
  cashierName?: string;
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
export type MovementType = 'sale' | 'adjustment' | 'return_' | 'transfer' | 'transfer_in' | 'transfer_out';

export type StockMovementReason = 
  | 'ASSIGN_TO_BAR'
  | 'MOVE_BETWEEN_BARS'
  | 'RETURN_TO_GLOBAL'
  | 'SALE_DECREMENT'
  | 'ADJUSTMENT'
  | 'RETURN_TO_PROVIDER'
  | 'INITIAL_LOAD';

export interface InventoryMovement {
  id: number;
  barId: number;
  drinkId: number;
  supplierId: number;
  quantity: number; // Negative for deductions, positive for additions
  type: MovementType;
  reason?: StockMovementReason;
  sellAsWholeUnit?: boolean;
  fromLocationType?: 'GLOBAL' | 'BAR';
  fromLocationId?: number;
  toLocationType?: 'GLOBAL' | 'BAR';
  toLocationId?: number;
  referenceId?: number;
  notes?: string;
  createdAt: string;
  drink?: Drink;
  supplier?: Supplier;
}

// Event types
export type EventStatus = 'upcoming' | 'active' | 'finished' | 'archived';

export interface Event {
  id: number;
  name: string;
  description?: string;
  status: EventStatus; // Estado persistido
  scheduledStartAt: string | null; // Fecha/hora programada
  startedAt: string | null; // Actual start time (manual)
  finishedAt: string | null;
  archivedAt: string | null; // Fecha de archivado
  stockDepletionPolicy: 'cheapest_first' | 'fifo' | 'consignment_last';
  ownerId: number;
  venueId: number;
  venue?: Venue;
}

export type VenueType = 'outdoor' | 'indoor' | 'nose';

export interface Venue {
  id: number;
  name: string;
  address: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  capacity: number;
  venueType: VenueType;
  placeId?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  ownerId?: number;
}

export interface CreateVenueDto {
  name: string;
  address: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  capacity: number;
  venueType?: VenueType;
  placeId?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
}

export interface UpdateVenueDto {
  name?: string;
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  capacity?: number;
  venueType?: VenueType;
  placeId?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
}

// Event interface already defined above with status

export interface CreateEventDto {
  name: string;
  description?: string;
  venueId: number;
  scheduledStartAt?: string; // Fecha/hora programada (debe ser futura)
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  venueId?: number;
  scheduledStartAt?: string; // Fecha/hora programada (debe ser futura)
}

export interface ActivateEventDto {
  barIds?: number[]; // Si vacío/null = todas las barras
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

// Global Inventory types (replaces ManagerInventory)
export interface GlobalInventory {
  id: number;
  ownerId: number;
  drinkId: number;
  supplierId: number | null;
  ownershipMode: OwnershipMode;
  totalQuantity: number;
  allocatedQuantity: number;
  unitCost: number;
  currency: string;
  sku: string | null;
  receivedAt: string;
  lastUpdatedAt: string;
  drink: Drink;
  supplier: Supplier | null;
}

export interface CreateGlobalInventoryDto {
  drinkId: number;
  supplierId?: number;
  totalQuantity: number;
  unitCost: number; // Costo unitario en centavos
  currency?: string;
  sku?: string;
  ownershipMode?: OwnershipMode;
}

export interface UpdateGlobalInventoryDto {
  totalQuantity?: number;
  unitCost?: number; // Costo unitario en centavos
  currency?: string;
  sku?: string;
  ownershipMode?: OwnershipMode;
}

// Stock Movement DTOs
export interface AssignStockDto {
  globalInventoryId: number;
  eventId: number;
  barId: number;
  quantity: number;
  notes?: string;
  // Venta directa: si true, el insumo se vende como unidad completa (ej: botella de agua)
  sellAsWholeUnit?: boolean;
  salePrice?: number; // Precio de venta en centavos (requerido si sellAsWholeUnit=true)
}

export interface MoveStockDto {
  eventId: number;
  fromBarId: number;
  toBarId: number;
  drinkId: number;
  quantity: number;
  notes?: string;
}

export interface ReturnStockDto {
  eventId: number;
  barId: number;
  drinkId: number;
  supplierId: number;
  sellAsWholeUnit: boolean;
  quantity: number;
  notes?: string;
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

// EventProduct types
export interface EventProduct {
  id: number;
  eventId: number;
  barId: number | null;
  name: string;
  price: number; // cents
  isCombo: boolean;
  cocktails: EventProductCocktail[];
}

export interface EventProductCocktail {
  eventProductId: number;
  cocktailId: number;
  cocktail: Cocktail;
}

export interface CreateProductDto {
  name: string;
  price: number; // cents
  cocktailIds: number[];
  barId?: number; // optional: per-bar product
}

export interface UpdateProductDto {
  name?: string;
  price?: number; // cents
  cocktailIds?: number[];
}

// ============= REPORT TYPES =============

export type BucketSize = 5 | 15 | 60;

export interface TopProductEntry {
  cocktailId: number;
  name: string;
  unitsSold: number;
  revenue: number;
  sharePercent: number;
  profit?: number;
}

export interface PeakHourEntry {
  hour: string;
  units: number;
  revenue: number;
  orderCount: number;
}

export interface PeakHourBucketEntry {
  startTime: string;
  endTime: string;
  salesCount: number;
  revenue: number;
  topProduct?: string;
}

export interface TimeSeriesEntry {
  timestamp: string;
  units: number;
  amount: number;
}

export interface RemainingStockEntry {
  barId: number;
  barName: string;
  drinkId: number;
  drinkName: string;
  supplierId: number;
  supplierName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  ownershipMode: 'purchased' | 'consignment';
}

export interface ConsumptionBySupplier {
  supplierId: number;
  supplierName: string;
  quantity: number;
  unitCost: number;
  cost: number;
  ownershipMode: 'purchased' | 'consignment';
}

export interface ConsumptionEntry {
  drinkId: number;
  drinkName: string;
  totalMl: number;
  totalCost: number;
  bySupplier: ConsumptionBySupplier[];
}

export interface ReportSummary {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  marginPercent: number;
  totalUnitsSold: number;
  totalOrderCount: number;
}

export interface RemainingStockSummary {
  totalValue: number;
  purchasedValue: number;
  consignmentValue: number;
  items: RemainingStockEntry[];
}

export interface BarBreakdown {
  barId: number;
  barName: string;
  barType: string;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  marginPercent: number;
  totalUnitsSold: number;
  totalOrderCount: number;
  avgTicketSize: number;
  topProducts: TopProductEntry[];
  peakHours: PeakHourEntry[];
}

export interface PosBreakdown {
  posnetId: number;
  posnetCode: string;
  posnetName: string;
  barId: number;
  barName: string;
  totalRevenue: number;
  totalTransactions: number;
  totalUnitsSold: number;
  avgTicketSize: number;
  busiestHours: Array<{
    hour: string;
    transactions: number;
    revenue: number;
  }>;
}

export interface StockValuationItem {
  drinkId: number;
  drinkName: string;
  quantity: number;
  unitCost: number;
  value: number;
  ownershipMode: 'purchased' | 'consignment';
}

export interface BarStockValuation {
  barId: number;
  barName: string;
  totalValue: number;
  purchasedValue: number;
  consignmentValue: number;
  items: StockValuationItem[];
}

export interface StockValuationSummary {
  totalValue: number;
  purchasedValue: number;
  consignmentValue: number;
  byBar: BarStockValuation[];
}

export interface CogsBreakdownByBar {
  barId: number;
  barName: string;
  totalCogs: number;
  byDrink: Array<{
    drinkId: number;
    drinkName: string;
    quantityUsed: number;
    cost: number;
  }>;
}

export interface EventReportData {
  summary: ReportSummary;
  topProducts: TopProductEntry[];
  peakHours: PeakHourEntry[];
  timeSeries: TimeSeriesEntry[];
  remainingStock: RemainingStockSummary;
  consumptionByDrink: ConsumptionEntry[];
  warnings: string[];
  // Enhanced fields
  peakHoursByBucket?: {
    '5min': PeakHourBucketEntry[];
    '15min': PeakHourBucketEntry[];
    '60min': PeakHourBucketEntry[];
  };
  barBreakdowns?: BarBreakdown[];
  posBreakdowns?: PosBreakdown[];
  stockValuation?: StockValuationSummary;
  cogsBreakdown?: CogsBreakdownByBar[];
  csvPath?: string;
  pdfPath?: string;
}

export interface GenerateReportDto {
  bucketSize?: BucketSize;
}
