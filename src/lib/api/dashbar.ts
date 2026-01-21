import axios from 'axios';
import { toast } from 'sonner';
import type {
  Bar,
  CreateBarDto,
  UpdateBarDto,
  Stock,
  StockSummary,
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
        toast.error('Session expired. Please log in again.');
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

  finishEvent: async (id: number): Promise<Event> => {
    const response = await api.post<Event>(`/events/${id}/finish`);
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
