import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricesApi } from '@/lib/api/dashbar';
import type { CreatePriceDto, UpdatePriceDto } from '@/lib/api/types';
import { toast } from 'sonner';

export const pricesKeys = {
  all: ['prices'] as const,
  lists: () => [...pricesKeys.all, 'list'] as const,
  list: (eventId: number, barId?: number) =>
    barId != null
      ? [...pricesKeys.lists(), eventId, barId] as const
      : [...pricesKeys.lists(), eventId] as const,
};

export function useEventPrices(eventId: number, barId?: number) {
  return useQuery({
    queryKey: pricesKeys.list(eventId, barId),
    queryFn: () => pricesApi.getPrices(eventId, barId),
    enabled: !!eventId,
  });
}

export function useCreatePrice(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePriceDto) => pricesApi.upsert(eventId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pricesKeys.lists() });
      if (variables.barId != null) {
        queryClient.invalidateQueries({
          queryKey: pricesKeys.list(eventId, variables.barId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: pricesKeys.list(eventId) });
      }
      toast.success('Precio guardado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Error al guardar precio');
    },
  });
}

export function useUpdatePrice(eventId: number, priceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePriceDto) => pricesApi.update(eventId, priceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricesKeys.lists() });
      toast.success('Precio actualizado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Error al actualizar precio');
    },
  });
}

export function useDeletePrice(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (priceId: number) => pricesApi.delete(eventId, priceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricesKeys.lists() });
      toast.success('Precio eliminado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Error al eliminar precio');
    },
  });
}
