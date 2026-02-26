import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '@/lib/api/dashbar';
import type { UpsertStockDto, BulkUpsertStockDto } from '@/lib/api/types';
import { toast } from 'sonner';

// Query keys
export const stockKeys = {
  all: ['stock'] as const,
  lists: () => [...stockKeys.all, 'list'] as const,
  list: (eventId: number, barId: number) =>
    [...stockKeys.lists(), eventId, barId] as const,
  summaries: () => [...stockKeys.all, 'summary'] as const,
  summary: (eventId: number, barId: number) =>
    [...stockKeys.summaries(), eventId, barId] as const,
  drinks: (eventId: number, barId: number) =>
    [...stockKeys.all, 'drinks', eventId, barId] as const,
};

// Hooks
export function useStock(eventId: number, barId: number) {
  return useQuery({
    queryKey: stockKeys.list(eventId, barId),
    queryFn: () => stockApi.getStock(eventId, barId),
    enabled: !!eventId && !!barId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/** Get unique drinks available in a bar's stock (for recipe ingredient selection) */
export function useBarStockDrinks(eventId: number, barId: number) {
  return useQuery({
    queryKey: stockKeys.drinks(eventId, barId),
    queryFn: () => stockApi.getStockDrinks(eventId, barId),
    enabled: !!eventId && !!barId,
  });
}

/** Get unique recipe drinks across all bars of a given type in an event */
export function useBarTypeDrinks(eventId: number, barType: string) {
  return useQuery({
    queryKey: ['stock', 'drinks-by-type', eventId, barType] as const,
    queryFn: () => stockApi.getDrinksByBarType(eventId, barType),
    enabled: !!eventId && !!barType,
  });
}

export function useStockSummary(eventId: number, barId: number) {
  return useQuery({
    queryKey: stockKeys.summary(eventId, barId),
    queryFn: () => stockApi.getStockSummary(eventId, barId),
    enabled: !!eventId && !!barId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useUpsertStock(eventId: number, barId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpsertStockDto) =>
      stockApi.upsertStock(eventId, barId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stockKeys.list(eventId, barId),
      });
      queryClient.invalidateQueries({
        queryKey: stockKeys.summary(eventId, barId),
      });
      toast.success('Stock actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar stock: ${error.message}`);
    },
  });
}

export function useBulkUpsertStock(eventId: number, barId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: BulkUpsertStockDto) =>
      stockApi.bulkUpsertStock(eventId, barId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stockKeys.list(eventId, barId),
      });
      queryClient.invalidateQueries({
        queryKey: stockKeys.summary(eventId, barId),
      });
      toast.success('Stock actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar stock: ${error.message}`);
    },
  });
}

export function useDeleteStock(eventId: number, barId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      drinkId,
      supplierId,
    }: {
      drinkId: number;
      supplierId: number;
    }) => stockApi.deleteStock(eventId, barId, drinkId, supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stockKeys.list(eventId, barId),
      });
      queryClient.invalidateQueries({
        queryKey: stockKeys.summary(eventId, barId),
      });
      toast.success('Stock eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar stock: ${error.message}`);
    },
  });
}
