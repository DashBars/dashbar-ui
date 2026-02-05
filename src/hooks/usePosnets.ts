import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posnetsApi } from '@/lib/api/dashbar';
import type { CreatePosnetDto, UpdatePosnetDto } from '@/lib/api/types';
import { toast } from 'sonner';

export const posnetsKeys = {
  all: ['posnets'] as const,
  lists: () => [...posnetsKeys.all, 'list'] as const,
  list: (eventId: number) => [...posnetsKeys.lists(), eventId] as const,
  detail: (id: number) => [...posnetsKeys.all, 'detail', id] as const,
};

export function useEventPosnets(eventId: number) {
  return useQuery({
    queryKey: posnetsKeys.list(eventId),
    queryFn: () => posnetsApi.getPosnets(eventId),
    enabled: !!eventId,
  });
}

export function usePosnet(id: number) {
  return useQuery({
    queryKey: posnetsKeys.detail(id),
    queryFn: () => posnetsApi.getPosnet(id),
    enabled: !!id,
  });
}

export function useCreatePosnet(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePosnetDto) => posnetsApi.createPosnet(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posnetsKeys.list(eventId) });
      toast.success('POS terminal created successfully');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Failed to create POS terminal');
    },
  });
}

export function useUpdatePosnet(id: number, eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePosnetDto) => posnetsApi.updatePosnet(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posnetsKeys.list(eventId) });
      queryClient.invalidateQueries({ queryKey: posnetsKeys.detail(id) });
      toast.success('POS terminal updated successfully');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Failed to update POS terminal');
    },
  });
}

export function useDeletePosnet(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => posnetsApi.deletePosnet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posnetsKeys.list(eventId) });
      toast.success('POS terminal deleted successfully');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Failed to delete POS terminal');
    },
  });
}

export function useRotatePosnetToken(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => posnetsApi.rotateToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posnetsKeys.detail(id) });
      toast.success('Token rotated successfully');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Failed to rotate token');
    },
  });
}
