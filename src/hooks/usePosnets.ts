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
    refetchInterval: 10_000,
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
      toast.success('Terminal POS creado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Error al crear el terminal POS');
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
      toast.success('Terminal POS actualizado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Error al actualizar el terminal POS');
    },
  });
}

export function useDeletePosnet(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => posnetsApi.deletePosnet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posnetsKeys.list(eventId) });
      toast.success('Terminal POS eliminado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Error al eliminar el terminal POS');
    },
  });
}

export function useRotatePosnetToken(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (posnetId: number) => posnetsApi.rotateToken(posnetId),
    onSuccess: (_data, posnetId) => {
      queryClient.invalidateQueries({ queryKey: posnetsKeys.detail(posnetId) });
      queryClient.invalidateQueries({ queryKey: posnetsKeys.list(eventId) });
      toast.success('Token rotado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Error al rotar el token. Verificá que el terminal exista.');
    },
  });
}
