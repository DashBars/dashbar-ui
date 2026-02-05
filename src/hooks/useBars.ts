import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { barsApi } from '@/lib/api/dashbar';
import type { CreateBarDto, UpdateBarDto } from '@/lib/api/types';
import { toast } from 'sonner';

// Query keys
export const barsKeys = {
  all: ['bars'] as const,
  lists: () => [...barsKeys.all, 'list'] as const,
  list: (eventId: number) => [...barsKeys.lists(), eventId] as const,
  details: () => [...barsKeys.all, 'detail'] as const,
  detail: (eventId: number, barId: number) =>
    [...barsKeys.details(), eventId, barId] as const,
};

// Hooks
export function useBars(eventId: number) {
  return useQuery({
    queryKey: barsKeys.list(eventId),
    queryFn: () => barsApi.getBars(eventId),
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useBar(eventId: number, barId: number) {
  return useQuery({
    queryKey: barsKeys.detail(eventId, barId),
    queryFn: () => barsApi.getBar(eventId, barId),
    enabled: !!eventId && !!barId,
  });
}

export function useCreateBar(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBarDto) => barsApi.createBar(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: barsKeys.list(eventId) });
      toast.success('Bar creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear bar: ${error.message}`);
    },
  });
}

export function useUpdateBar(eventId: number, barId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateBarDto) =>
      barsApi.updateBar(eventId, barId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: barsKeys.list(eventId) });
      queryClient.invalidateQueries({
        queryKey: barsKeys.detail(eventId, barId),
      });
      toast.success('Bar actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar bar: ${error.message}`);
    },
  });
}

export function useDeleteBar(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (barId: number) => barsApi.deleteBar(eventId, barId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: barsKeys.list(eventId) });
      toast.success('Bar eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar bar: ${error.message}`);
    },
  });
}
