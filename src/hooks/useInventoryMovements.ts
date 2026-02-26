import { useQuery } from '@tanstack/react-query';
import { inventoryMovementsApi } from '@/lib/api/dashbar';

export const inventoryMovementsKeys = {
  all: ['inventory-movements'] as const,
  lists: () => [...inventoryMovementsKeys.all, 'list'] as const,
  list: (eventId: number, barId: number) =>
    [...inventoryMovementsKeys.lists(), eventId, barId] as const,
  byGlobal: (globalInventoryId: number) =>
    [...inventoryMovementsKeys.lists(), 'global', globalInventoryId] as const,
};

export function useInventoryMovements(eventId: number, barId: number) {
  return useQuery({
    queryKey: inventoryMovementsKeys.list(eventId, barId),
    queryFn: () => inventoryMovementsApi.findAll(eventId, barId),
    enabled: !!eventId && !!barId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useGlobalInventoryMovements(globalInventoryId: number) {
  return useQuery({
    queryKey: inventoryMovementsKeys.byGlobal(globalInventoryId),
    queryFn: () => inventoryMovementsApi.findByGlobalInventory(globalInventoryId),
    enabled: !!globalInventoryId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
