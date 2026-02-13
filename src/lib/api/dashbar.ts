import axios from 'axios';
import { toast } from 'sonner';
import type {
  Bar,
  CreateBarDto,
  UpdateBarDto,
  Stock,
  StockSummary,
  BarStockDrink,
  UpsertStockDto,
  BulkUpsertStockDto,
  RecipeOverride,
  CreateRecipeOverrideDto,
  UpdateRecipeOverrideDto,
  LoginDto,
  AuthResponse,
  User,
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
  Drink,
  ConsignmentReturnSummary,
  ExecuteReturnResult,
  InventoryMovement,
  Event,
  CreateEventDto,
  UpdateEventDto,
  ActivateEventDto,
  Venue,
  CreateVenueDto,
  UpdateVenueDto,
  ManagerInventory,
  ManagerInventoryAllocation,
  CreateManagerInventoryDto,
  UpdateManagerInventoryDto,
  TransferToBarDto,
  CreateDrinkDto,
  UpdateDrinkDto,
  GlobalInventory,
  CreateGlobalInventoryDto,
  UpdateGlobalInventoryDto,
  AssignStockDto,
  MoveStockDto,
  ReturnStockDto,
  BulkReturnStockDto,
  BulkReturnResult,
  EventRecipe,
  CreateRecipeDto,
  UpdateRecipeDto,
  EventPrice,
  CreatePriceDto,
  UpdatePriceDto,
  Cocktail,
  EventProduct,
  CreateProductDto,
  UpdateProductDto,
  Posnet,
  CreatePosnetDto,
  UpdatePosnetDto,
  POSLoginResponse,
  POSConfig,
  POSProduct,
  POSSession,
  POSSale,
  CreatePOSSaleDto,
  ReceiptData,
  DashboardTotals,
  TimeSeriesResponse,
  TopProductsResponse,
} from './types';

// Configure axios base URL - adjust this to match your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token if available (you may need to adjust this based on your auth setup)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add error interceptor for better error handling
let isRedirecting = false;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token
      localStorage.removeItem('auth_token');
      
      // Only redirect if we're not already on login page and not already redirecting
      // Note: We use window.location instead of navigate because this runs outside React context
      if (!isRedirecting && !window.location.pathname.includes('/login')) {
        isRedirecting = true;
        const currentPath = window.location.pathname + window.location.search;
        toast.error('Sesión expirada. Iniciá sesión nuevamente.');
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', dto);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// Bars API
export const barsApi = {
  getBars: async (eventId: number): Promise<Bar[]> => {
    const response = await api.get<Bar[]>(`/events/${eventId}/bars`);
    return response.data;
  },

  getBar: async (eventId: number, barId: number): Promise<Bar> => {
    const response = await api.get<Bar>(`/events/${eventId}/bars/${barId}`);
    return response.data;
  },

  createBar: async (eventId: number, dto: CreateBarDto): Promise<Bar> => {
    const response = await api.post<Bar>(`/events/${eventId}/bars`, dto);
    return response.data;
  },

  updateBar: async (
    eventId: number,
    barId: number,
    dto: UpdateBarDto,
  ): Promise<Bar> => {
    const response = await api.put<Bar>(
      `/events/${eventId}/bars/${barId}`,
      dto,
    );
    return response.data;
  },

  deleteBar: async (eventId: number, barId: number): Promise<void> => {
    await api.delete(`/events/${eventId}/bars/${barId}`);
  },
};

// Stock API
export const stockApi = {
  getStock: async (eventId: number, barId: number): Promise<Stock[]> => {
    const response = await api.get<Stock[]>(
      `/events/${eventId}/bars/${barId}/stock`,
    );
    return response.data;
  },

  getStockSummary: async (
    eventId: number,
    barId: number,
  ): Promise<StockSummary[]> => {
    const response = await api.get<StockSummary[]>(
      `/events/${eventId}/bars/${barId}/stock/summary`,
    );
    return response.data;
  },

  /** Get unique drinks available in a bar's stock (for recipe ingredient selection) */
  getStockDrinks: async (
    eventId: number,
    barId: number,
  ): Promise<BarStockDrink[]> => {
    const response = await api.get<BarStockDrink[]>(
      `/events/${eventId}/bars/${barId}/stock/drinks`,
    );
    return response.data;
  },

  /** Get unique recipe drinks across all bars of a given type in an event */
  getDrinksByBarType: async (
    eventId: number,
    barType: string,
  ): Promise<BarStockDrink[]> => {
    const response = await api.get<BarStockDrink[]>(
      `/events/${eventId}/stock/drinks-by-type/${barType}`,
    );
    return response.data;
  },

  upsertStock: async (
    eventId: number,
    barId: number,
    dto: UpsertStockDto,
  ): Promise<Stock> => {
    const response = await api.post<Stock>(
      `/events/${eventId}/bars/${barId}/stock`,
      dto,
    );
    return response.data;
  },

  bulkUpsertStock: async (
    eventId: number,
    barId: number,
    dto: BulkUpsertStockDto,
  ): Promise<Stock[]> => {
    const response = await api.post<Stock[]>(
      `/events/${eventId}/bars/${barId}/stock/bulk`,
      dto,
    );
    return response.data;
  },

  deleteStock: async (
    eventId: number,
    barId: number,
    drinkId: number,
    supplierId: number,
  ): Promise<void> => {
    await api.delete(
      `/events/${eventId}/bars/${barId}/stock/${drinkId}/supplier/${supplierId}`,
    );
  },

  getStockBySupplier: async (
    eventId: number,
    barId: number,
  ): Promise<Stock[]> => {
    const response = await api.get<Stock[]>(
      `/events/${eventId}/bars/${barId}/stock/by-supplier`,
    );
    return response.data;
  },

  getConsignmentStock: async (
    eventId: number,
    barId: number,
  ): Promise<Stock[]> => {
    const response = await api.get<Stock[]>(
      `/events/${eventId}/bars/${barId}/stock/consignment`,
    );
    return response.data;
  },

  getConsignmentReturns: async (
    eventId: number,
    barId: number,
  ): Promise<any[]> => {
    const response = await api.get<any[]>(
      `/events/${eventId}/bars/${barId}/stock/consignment-returns`,
    );
    return response.data;
  },
};

// Recipe Overrides API
export const recipeOverridesApi = {
  getRecipeOverrides: async (
    eventId: number,
    barId: number,
  ): Promise<RecipeOverride[]> => {
    const response = await api.get<RecipeOverride[]>(
      `/events/${eventId}/bars/${barId}/recipe-overrides`,
    );
    return response.data;
  },

  createRecipeOverride: async (
    eventId: number,
    barId: number,
    dto: CreateRecipeOverrideDto,
  ): Promise<RecipeOverride> => {
    const response = await api.post<RecipeOverride>(
      `/events/${eventId}/bars/${barId}/recipe-overrides`,
      dto,
    );
    return response.data;
  },

  updateRecipeOverride: async (
    eventId: number,
    barId: number,
    overrideId: number,
    dto: UpdateRecipeOverrideDto,
  ): Promise<RecipeOverride> => {
    const response = await api.put<RecipeOverride>(
      `/events/${eventId}/bars/${barId}/recipe-overrides/${overrideId}`,
      dto,
    );
    return response.data;
  },

  deleteRecipeOverride: async (
    eventId: number,
    barId: number,
    overrideId: number,
  ): Promise<void> => {
    await api.delete(
      `/events/${eventId}/bars/${barId}/recipe-overrides/${overrideId}`,
    );
  },
};

// Event Recipes API (per event & bar type)
export const recipesApi = {
  getRecipes: async (eventId: number, barType?: string): Promise<EventRecipe[]> => {
    const response = await api.get<EventRecipe[]>(`/events/${eventId}/recipes`, {
      params: barType ? { barType } : undefined,
    });
    return response.data;
  },

  createRecipe: async (eventId: number, dto: CreateRecipeDto): Promise<EventRecipe> => {
    const response = await api.post<EventRecipe>(`/events/${eventId}/recipes`, dto);
    return response.data;
  },

  updateRecipe: async (
    eventId: number,
    recipeId: number,
    dto: UpdateRecipeDto,
  ): Promise<EventRecipe> => {
    const response = await api.put<EventRecipe>(
      `/events/${eventId}/recipes/${recipeId}`,
      dto,
    );
    return response.data;
  },

  deleteRecipe: async (eventId: number, recipeId: number): Promise<void> => {
    await api.delete(`/events/${eventId}/recipes/${recipeId}`);
  },

  copyRecipes: async (
    eventId: number,
    fromBarType: string,
    toBarType: string,
  ): Promise<EventRecipe[]> => {
    const response = await api.post<EventRecipe[]>(
      `/events/${eventId}/recipes/copy`,
      null,
      { params: { from: fromBarType, to: toBarType } },
    );
    return response.data;
  },
};

// Event/bar prices API
export const pricesApi = {
  getPrices: async (eventId: number, barId?: number): Promise<EventPrice[]> => {
    const response = await api.get<EventPrice[]>(`/events/${eventId}/prices`, {
      params: barId != null ? { barId } : undefined,
    });
    return response.data;
  },

  upsert: async (eventId: number, dto: CreatePriceDto): Promise<EventPrice> => {
    const response = await api.post<EventPrice>(`/events/${eventId}/prices`, dto);
    return response.data;
  },

  bulkUpsert: async (
    eventId: number,
    prices: CreatePriceDto[],
  ): Promise<EventPrice[]> => {
    const response = await api.post<EventPrice[]>(
      `/events/${eventId}/prices/bulk`,
      prices,
    );
    return response.data;
  },

  update: async (
    eventId: number,
    priceId: number,
    dto: UpdatePriceDto,
  ): Promise<EventPrice> => {
    const response = await api.put<EventPrice>(
      `/events/${eventId}/prices/${priceId}`,
      dto,
    );
    return response.data;
  },

  delete: async (eventId: number, priceId: number): Promise<void> => {
    await api.delete(`/events/${eventId}/prices/${priceId}`);
  },
};

// Products API
export const productsApi = {
  getProducts: async (eventId: number, barId?: number): Promise<EventProduct[]> => {
    const url = barId != null 
      ? `/events/${eventId}/bars/${barId}/products`
      : `/events/${eventId}/products`;
    const response = await api.get<EventProduct[]>(url);
    return response.data;
  },

  getProduct: async (eventId: number, productId: number): Promise<EventProduct> => {
    const response = await api.get<EventProduct>(
      `/events/${eventId}/products/${productId}`
    );
    return response.data;
  },

  create: async (eventId: number, dto: CreateProductDto): Promise<EventProduct> => {
    const response = await api.post<EventProduct>(
      `/events/${eventId}/products`,
      dto
    );
    return response.data;
  },

  update: async (
    eventId: number,
    productId: number,
    dto: UpdateProductDto
  ): Promise<EventProduct> => {
    const response = await api.put<EventProduct>(
      `/events/${eventId}/products/${productId}`,
      dto
    );
    return response.data;
  },

  delete: async (eventId: number, productId: number): Promise<void> => {
    await api.delete(`/events/${eventId}/products/${productId}`);
  },
};

// Cocktails API (product catalog for prices)
export const cocktailsApi = {
  getCocktails: async (includeInactive = false): Promise<Cocktail[]> => {
    const response = await api.get<Cocktail[]>('/cocktails', {
      params: { includeInactive },
    });
    return response.data;
  },
};

// Suppliers API
export const suppliersApi = {
  findAll: async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>('/suppliers');
    return response.data;
  },

  findOne: async (id: number): Promise<Supplier> => {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  create: async (dto: CreateSupplierDto): Promise<Supplier> => {
    const response = await api.post<Supplier>('/suppliers', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateSupplierDto): Promise<Supplier> => {
    const response = await api.patch<Supplier>(`/suppliers/${id}`, dto);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};

// Manager Inventory API
export const managerInventoryApi = {
  findAll: async (): Promise<ManagerInventory[]> => {
    const response = await api.get<ManagerInventory[]>('/manager-inventory');
    return response.data;
  },

  findOne: async (id: number): Promise<ManagerInventory> => {
    const response = await api.get<ManagerInventory>(`/manager-inventory/${id}`);
    return response.data;
  },

  create: async (dto: CreateManagerInventoryDto): Promise<ManagerInventory> => {
    const response = await api.post<ManagerInventory>('/manager-inventory', dto);
    return response.data;
  },

  update: async (
    id: number,
    dto: UpdateManagerInventoryDto,
  ): Promise<ManagerInventory> => {
    const response = await api.patch<ManagerInventory>(
      `/manager-inventory/${id}`,
      dto,
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/manager-inventory/${id}`);
  },

  transferToBar: async (
    id: number,
    dto: TransferToBarDto,
  ): Promise<{ stock: Stock; allocation: ManagerInventoryAllocation }> => {
    const response = await api.post<{ stock: Stock; allocation: ManagerInventoryAllocation }>(
      `/manager-inventory/${id}/transfer`,
      dto,
    );
    return response.data;
  },

  getAllocations: async (
    id: number,
  ): Promise<ManagerInventoryAllocation[]> => {
    const response = await api.get<ManagerInventoryAllocation[]>(
      `/manager-inventory/${id}/allocations`,
    );
    return response.data;
  },
};

// Drinks API
export const globalInventoryApi = {
  getAll: async (): Promise<GlobalInventory[]> => {
    const response = await api.get<GlobalInventory[]>('/global-inventory');
    return response.data;
  },
  getOne: async (id: number): Promise<GlobalInventory> => {
    const response = await api.get<GlobalInventory>(`/global-inventory/${id}`);
    return response.data;
  },
  create: async (dto: CreateGlobalInventoryDto): Promise<GlobalInventory> => {
    const response = await api.post<GlobalInventory>('/global-inventory', dto);
    return response.data;
  },
  update: async (id: number, dto: UpdateGlobalInventoryDto): Promise<GlobalInventory> => {
    const response = await api.patch<GlobalInventory>(`/global-inventory/${id}`, dto);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/global-inventory/${id}`);
  },
};

export const drinksApi = {
  findAll: async (): Promise<Drink[]> => {
    const response = await api.get<Drink[]>('/drinks');
    return response.data;
  },

  search: async (query: string): Promise<Drink[]> => {
    const response = await api.get<Drink[]>(`/drinks/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  findOne: async (id: number): Promise<Drink> => {
    const response = await api.get<Drink>(`/drinks/${id}`);
    return response.data;
  },

  create: async (dto: CreateDrinkDto): Promise<Drink> => {
    const response = await api.post<Drink>('/drinks', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateDrinkDto): Promise<Drink> => {
    const response = await api.patch<Drink>(`/drinks/${id}`, dto);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/drinks/${id}`);
  },
};

// Consignment API
export const consignmentApi = {
  getReturnSummary: async (
    eventId: number,
    barId: number,
  ): Promise<ConsignmentReturnSummary[]> => {
    const response = await api.get<ConsignmentReturnSummary[]>(
      `/events/${eventId}/bars/${barId}/consignment/summary`,
    );
    return response.data;
  },

  executeReturn: async (
    eventId: number,
    barId: number,
    drinkId: number,
    supplierId: number,
    notes?: string,
  ): Promise<ExecuteReturnResult> => {
    const response = await api.post<ExecuteReturnResult>(
      `/events/${eventId}/bars/${barId}/consignment/returns/${drinkId}/${supplierId}/execute`,
      { notes },
    );
    return response.data;
  },

  executeAllReturns: async (
    eventId: number,
    barId: number,
  ): Promise<ExecuteReturnResult[]> => {
    const response = await api.post<ExecuteReturnResult[]>(
      `/events/${eventId}/bars/${barId}/consignment/returns/execute-all`,
    );
    return response.data;
  },
};

// Inventory Movements API
export const inventoryMovementsApi = {
  findAll: async (
    eventId: number,
    barId: number,
  ): Promise<InventoryMovement[]> => {
    const response = await api.get<InventoryMovement[]>(
      `/events/${eventId}/bars/${barId}/inventory-movements`,
    );
    return response.data;
  },
  findByGlobalInventory: async (
    globalInventoryId: number,
  ): Promise<InventoryMovement[]> => {
    const response = await api.get<InventoryMovement[]>(
      `/global-inventory/${globalInventoryId}/movements`,
    );
    return response.data;
  },
};

// Events API
export const eventsApi = {
  getEvents: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events');
    return response.data;
  },

  getEvent: async (id: number): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  createEvent: async (dto: CreateEventDto): Promise<Event> => {
    const response = await api.post<Event>('/events', dto);
    return response.data;
  },

  updateEvent: async (id: number, dto: UpdateEventDto): Promise<Event> => {
    const response = await api.patch<Event>(`/events/${id}`, dto);
    return response.data;
  },

  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  startEvent: async (id: number): Promise<Event> => {
    const response = await api.post<Event>(`/events/${id}/start`);
    return response.data;
  },

  activateEvent: async (id: number, dto: ActivateEventDto): Promise<Event> => {
    const response = await api.post<Event>(`/events/${id}/activate`, dto);
    return response.data;
  },

  finishEvent: async (id: number): Promise<Event> => {
    const response = await api.post<Event>(`/events/${id}/finish`);
    return response.data;
  },

  archiveEvent: async (id: number): Promise<Event> => {
    const response = await api.post<Event>(`/events/${id}/archive`);
    return response.data;
  },

  unarchiveEvent: async (id: number): Promise<Event> => {
    const response = await api.post<Event>(`/events/${id}/unarchive`);
    return response.data;
  },
};

// Stock Movements API
export const stockMovementsApi = {
  assign: async (dto: AssignStockDto) => {
    const response = await api.post('/stock/assign', dto);
    return response.data;
  },
  move: async (dto: MoveStockDto) => {
    const response = await api.post('/stock/move', dto);
    return response.data;
  },
  return: async (dto: ReturnStockDto) => {
    const response = await api.post('/stock/return', dto);
    return response.data;
  },
  returnToSupplier: async (dto: ReturnStockDto) => {
    const response = await api.post('/stock/return-to-supplier', dto);
    return response.data;
  },
  bulkReturn: async (dto: BulkReturnStockDto): Promise<BulkReturnResult> => {
    const response = await api.post('/stock/bulk-return', dto);
    return response.data;
  },
};

// Venues API
export const venuesApi = {
  getVenues: async (): Promise<Venue[]> => {
    const response = await api.get<Venue[]>('/venues');
    return response.data;
  },

  getVenue: async (id: number): Promise<Venue> => {
    const response = await api.get<Venue>(`/venues/${id}`);
    return response.data;
  },

  createVenue: async (dto: CreateVenueDto): Promise<Venue> => {
    const response = await api.post<Venue>('/venues', dto);
    return response.data;
  },

  updateVenue: async (id: number, dto: UpdateVenueDto): Promise<Venue> => {
    const response = await api.patch<Venue>(`/venues/${id}`, dto);
    return response.data;
  },

  deleteVenue: async (id: number): Promise<void> => {
    await api.delete(`/venues/${id}`);
  },
};

// POS Management API (for managers/admins)
export const posnetsApi = {
  getPosnets: async (eventId: number): Promise<Posnet[]> => {
    const response = await api.get<Posnet[]>(`/events/${eventId}/posnets`);
    return response.data;
  },

  getPosnet: async (id: number): Promise<Posnet> => {
    const response = await api.get<Posnet>(`/posnets/${id}`);
    return response.data;
  },

  createPosnet: async (eventId: number, dto: CreatePosnetDto): Promise<Posnet> => {
    const response = await api.post<Posnet>(`/events/${eventId}/posnets`, dto);
    return response.data;
  },

  updatePosnet: async (id: number, dto: UpdatePosnetDto): Promise<Posnet> => {
    const response = await api.patch<Posnet>(`/posnets/${id}`, dto);
    return response.data;
  },

  deletePosnet: async (id: number): Promise<void> => {
    await api.delete(`/posnets/${id}`);
  },

  rotateToken: async (id: number): Promise<{ authToken: string }> => {
    const response = await api.post<{ authToken: string }>(`/posnets/${id}/rotate-token`);
    return response.data;
  },
};

// POS Device API (for kiosk devices)
// Create a separate axios instance for POS API calls that uses POS token
const posApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add POS token interceptor
posApi.interceptors.request.use((config) => {
  const posToken = localStorage.getItem('pos_token');
  if (posToken) {
    config.headers['X-POS-Token'] = posToken;
  }
  return config;
});

export const posDeviceApi = {
  // Login with POS code
  login: async (code: string): Promise<POSLoginResponse> => {
    const response = await axios.post<POSLoginResponse>(
      `${API_BASE_URL}/pos/login`,
      { code }
    );
    return response.data;
  },

  // Get POS config (products, session, etc.)
  getConfig: async (posnetId: number): Promise<POSConfig> => {
    // Backend returns catalog with products filtered by bar
    const response = await posApi.get(`/pos/${posnetId}/config`);
    const data = response.data as {
      posnet: POSConfig['posnet'];
      event: { id: number; name: string };
      bar: { id: number; name: string; type: string };
      catalog: {
        products?: Array<{
          id: number;
          name: string;
          price: number;
          isCombo: boolean;
          cocktailId?: number;
          stockLevel?: number;
          glassVolume?: number;
          hasIce?: boolean;
          components?: Array<{
            drinkId: number;
            drinkName: string;
            drinkBrand: string;
            percentage: number;
          }>;
        }>;
        categories: Array<{
          id: number;
          name: string;
        }>;
      };
      session: POSConfig['session'];
    };

    // Only use EventProducts (created via "producto final" toggle in recipes)
    // Do NOT fall back to cocktails - only show explicitly created products
    const products: POSProduct[] = (data.catalog?.products || []).map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      available: product.stockLevel === undefined || product.stockLevel > 0,
      stockLevel: product.stockLevel,
      cocktailId: product.cocktailId,
      category: product.isCombo ? 'Combos' : undefined,
      glassVolume: product.glassVolume,
      hasIce: product.hasIce,
      components: product.components,
    }));

    // Categories from the catalog
    const categories: string[] = data.catalog?.categories?.map(c => c.name) || [];

    return {
      posnet: data.posnet,
      event: data.event,
      bar: data.bar,
      products,
      categories,
      session: data.session,
    };
  },

  // Open a session
  openSession: async (posnetId: number, openingCash: number): Promise<POSSession> => {
    const response = await posApi.post<POSSession>(`/pos/${posnetId}/sessions`, {
      openingCash,
    });
    return response.data;
  },

  // Close a session
  closeSession: async (
    posnetId: number,
    closingCash: number,
    notes?: string
  ): Promise<POSSession> => {
    const response = await posApi.post<POSSession>(`/pos/${posnetId}/sessions/close`, {
      closingCash,
      notes,
    });
    return response.data;
  },

  // Create a sale
  createSale: async (posnetId: number, dto: CreatePOSSaleDto): Promise<POSSale> => {
    const response = await posApi.post<POSSale>(`/pos/${posnetId}/sales`, dto);
    return response.data;
  },

  // Get sales history
  getSales: async (posnetId: number): Promise<POSSale[]> => {
    const response = await posApi.get<POSSale[]>(`/pos/${posnetId}/sales`);
    return response.data;
  },

  // Get single sale
  getSale: async (posnetId: number, saleId: number): Promise<POSSale> => {
    const response = await posApi.get<POSSale>(`/pos/${posnetId}/sales/${saleId}`);
    return response.data;
  },

  // Process refund
  refundSale: async (
    posnetId: number,
    saleId: number,
    reason: string
  ): Promise<POSSale> => {
    const response = await posApi.post<POSSale>(
      `/pos/${posnetId}/sales/${saleId}/refund`,
      { reason }
    );
    return response.data;
  },

  // Get receipt data
  getReceipt: async (posnetId: number, saleId: number): Promise<ReceiptData> => {
    const response = await posApi.get<ReceiptData>(
      `/pos/${posnetId}/sales/${saleId}/receipt`
    );
    return response.data;
  },

  // Get receipt HTML
  getReceiptHtml: async (posnetId: number, saleId: number): Promise<string> => {
    const response = await posApi.get<string>(
      `/pos/${posnetId}/sales/${saleId}/receipt/html`
    );
    return response.data;
  },

  // Send heartbeat
  heartbeat: async (posnetId: number, sessionId?: number): Promise<void> => {
    await posApi.post(`/pos/${posnetId}/heartbeat`, { sessionId });
  },
};

// Reports API
import type {
  EventReportData,
  GenerateReportDto,
  EventReportListItem,
  EligibleEventForComparison,
  EventComparisonReport,
} from './types';

export const reportsApi = {
  // Get all reports for the authenticated user
  getAllReports: async (): Promise<EventReportListItem[]> => {
    const response = await api.get<EventReportListItem[]>('/reports');
    return response.data;
  },

  // Get report for an event
  getReport: async (eventId: number): Promise<EventReportData> => {
    const response = await api.get<EventReportData>(`/events/${eventId}/report`);
    return response.data;
  },

  // Generate or regenerate a report
  generateReport: async (eventId: number, dto?: GenerateReportDto): Promise<any> => {
    const response = await api.post(`/events/${eventId}/report/generate`, dto || {});
    return response.data;
  },

  // Check if report exists
  hasReport: async (eventId: number): Promise<boolean> => {
    try {
      await api.get(`/events/${eventId}/report`);
      return true;
    } catch {
      return false;
    }
  },

  // Generate CSV export
  generateCSV: async (eventId: number): Promise<{ path: string }> => {
    const response = await api.post<{ path: string }>(`/events/${eventId}/report/csv`);
    return response.data;
  },

  // Download CSV export
  downloadCSV: async (eventId: number): Promise<Blob> => {
    const response = await api.get(`/events/${eventId}/report/csv`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Generate PDF export
  generatePDF: async (eventId: number): Promise<{ path: string }> => {
    const response = await api.post<{ path: string }>(`/events/${eventId}/report/pdf`);
    return response.data;
  },

  // Download PDF export
  downloadPDF: async (eventId: number): Promise<Blob> => {
    const response = await api.get(`/events/${eventId}/report/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Send report via email
  sendReportEmail: async (eventId: number, recipients: string[]): Promise<{ message: string }> => {
    const response = await api.post(`/events/${eventId}/report/send-email`, { recipients });
    return response.data;
  },

  // Get events eligible for comparison
  getEligibleForComparison: async (): Promise<EligibleEventForComparison[]> => {
    const response = await api.get<EligibleEventForComparison[]>('/reports/comparison/eligible');
    return response.data;
  },

  // Generate comparison report for multiple events
  generateComparison: async (eventIds: number[]): Promise<EventComparisonReport> => {
    const response = await api.post<EventComparisonReport>('/reports/comparison', { eventIds });
    return response.data;
  },
};

// ── Dashboard / Monitoring API ──

export const dashboardApi = {
  /** Get aggregated sales + consumption totals for an event */
  getTotals: async (eventId: number): Promise<DashboardTotals> => {
    const response = await api.get<DashboardTotals>(
      `/events/${eventId}/dashboard/totals`,
    );
    return response.data;
  },

  /** Get time-series sales data (bucketed) */
  getTimeSeries: async (
    eventId: number,
    bucket: string = '5m',
  ): Promise<TimeSeriesResponse> => {
    const response = await api.get<TimeSeriesResponse>(
      `/events/${eventId}/dashboard/time-series`,
      { params: { bucket } },
    );
    return response.data;
  },

  /** Get top products by units sold */
  getTopProducts: async (
    eventId: number,
    limit: number = 5,
  ): Promise<TopProductsResponse> => {
    const response = await api.get<TopProductsResponse>(
      `/events/${eventId}/dashboard/top-products`,
      { params: { limit } },
    );
    return response.data;
  },
};
