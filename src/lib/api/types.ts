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
  drinkVolume: number;    // ml per unit (bottle/can size)
  totalQuantity: number;  // total ml in stock
  unitCount: number;      // equivalent whole units (bottles/cans)
  supplierCount: number;
}

/** Unique drink available in a bar's stock (aggregated across suppliers) */
export interface BarStockDrink {
  drinkId: number;
  name: string;
  brand: string;
  volume: number;     // ml per unit (bottle/can size)
  totalMl: number;    // total ml available
  unitCount: number;  // equivalent whole units
  costPerMl?: number; // weighted average cost in cents per ml (only from drinks-by-type endpoint)
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
  _count?: {
    globalInventories: number;
    stocks: number;
    eventRecipeComponents: number;
    inventoryMovements: number;
  };
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
export type POSPaymentMethod = 'credit' | 'debit' | 'cash' | 'bankTransfer' | 'wallet';

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
  // Cocktail ID linked to this product (needed for POS sales)
  cocktailId?: number;
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
    cocktailId: number;
    quantity: number;
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
  bar?: { id: number; name: string };
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

export type BulkReturnMode = 'to_global' | 'to_supplier' | 'auto';

export interface BulkReturnStockDto {
  items: ReturnStockDto[];
  mode: BulkReturnMode;
  notes?: string;
}

export interface BulkReturnResult {
  processed: number;
  toGlobal: number;
  toSupplier: number;
  errors: string[];
}

export interface DiscardStockDto {
  eventId: number;
  barId: number;
  drinkId: number;
  supplierId: number;
  sellAsWholeUnit: boolean;
  notes?: string;
}

export interface BulkDiscardStockDto {
  items: DiscardStockDto[];
  notes?: string;
}

export interface BulkDiscardResult {
  processed: number;
  totalMlDiscarded: number;
  errors: string[];
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

// ============= COMPARISON TYPES =============

export interface EligibleEventForComparison {
  eventId: number;
  eventName: string;
  startedAt: string;
  finishedAt: string;
  durationHours: number;
  hasReport: boolean;
}

export interface EventComparisonRow {
  eventId: number;
  eventName: string;
  startedAt: string;
  finishedAt: string;
  durationHours: number;
  // Totals
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  marginPercent: number;
  totalUnitsSold: number;
  totalOrderCount: number;
  // Normalized per hour
  revenuePerHour: number;
  cogsPerHour: number;
  unitsPerHour: number;
  ordersPerHour: number;
}

export interface CrossEventProductByEvent {
  eventId: number;
  eventName: string;
  unitsSold: number;
  revenue: number;
  sharePercent: number;
  rank: number;
}

export interface CrossEventProduct {
  cocktailId: number;
  name: string;
  eventsAppeared: number;
  totalUnitsAcrossEvents: number;
  totalRevenueAcrossEvents: number;
  avgSharePercent: number;
  byEvent: CrossEventProductByEvent[];
}

export interface PeakTimePatternEvent {
  eventId: number;
  eventName: string;
  units: number;
  revenue: number;
}

export interface PeakTimePattern {
  hourOfDay: number;
  eventsWithPeak: number;
  eventDetails: PeakTimePatternEvent[];
}

export type InsightType =
  | 'consistent_top_product'
  | 'peak_time_pattern'
  | 'margin_outlier'
  | 'volume_outlier';

export interface ComparisonInsight {
  type: InsightType;
  message: string;
  data: Record<string, any>;
}

export interface EventTimeSeries {
  eventId: number;
  eventName: string;
  series: TimeSeriesEntry[];
}

export interface EventComparisonReport {
  generatedAt: string;
  eventIds: number[];
  eventComparison: EventComparisonRow[];
  crossEventProducts: CrossEventProduct[];
  peakTimePatterns: PeakTimePattern[];
  timeSeriesByEvent: EventTimeSeries[];
  insights: ComparisonInsight[];
}

// Report list item (from GET /reports)
export interface EventReportListItem {
  id: number;
  eventId: number;
  generatedAt: string;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalUnitsSold: number;
  totalOrderCount: number;
  event: {
    id: number;
    name: string;
    startedAt: string | null;
    finishedAt: string | null;
  };
}

// ── Dashboard / Monitoring types ──

export interface DashboardTotals {
  sales: {
    totalAmount: number;
    totalUnits: number;
    orderCount: number;
  };
  consumption: {
    totalMl: number;
    byDrink: Array<{
      drinkId: number;
      name: string;
      totalMl: number;
    }>;
  };
}

export interface TimeSeriesPoint {
  timestamp: string;
  units: number;
  amount: number;
}

export interface TimeSeriesResponse {
  bucketSize: string;
  series: TimeSeriesPoint[];
}

export interface TopProduct {
  cocktailId: number;
  name: string;
  units: number;
  amount: number;
}

export interface TopProductsResponse {
  products: TopProduct[];
}

// WebSocket event payloads

export interface WsSaleCreatedPayload {
  type: 'sale:created';
  eventId: number;
  barId: number;
  data: {
    saleId: number;
    cocktailId: number;
    cocktailName: string;
    quantity: number;
    totalAmount: number;
    createdAt: string;
  };
}

export interface WsConsumptionUpdatedPayload {
  type: 'consumption:updated';
  eventId: number;
  barId: number;
  data: {
    saleId: number;
    depletions: Array<{
      drinkId: number;
      drinkName: string;
      supplierId: number;
      quantityDeducted: number;
    }>;
  };
}

export interface WsPosStateUpdatePayload {
  posnetId: number;
  state: PosnetStatus;
  reason?: string;
}

export interface WsPosMetricsUpdatePayload {
  posnetId: number;
  metrics: {
    traffic: number;
    status: PosnetStatus;
  };
}

export interface WsPosSalePayload {
  posnetId: number;
  eventId: number;
  barId: number;
  sale: {
    id: number;
    total: number;
    itemCount: number;
    productName?: string;
  };
}

export interface WsAlertPayload {
  id: number;
  eventId: number;
  barId: number;
  drinkId: number;
  drinkName?: string;
  barName?: string;
  type: string;
  message: string;
  createdAt: string;
}
