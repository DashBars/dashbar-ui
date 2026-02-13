import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venuesApi } from '@/lib/api/dashbar';
import type { CreateVenueDto, UpdateVenueDto } from '@/lib/api/types';
import { toast } from 'sonner';

export const venuesKeys = {
  all: ['venues'] as const,
  lists: () => [...venuesKeys.all, 'list'] as const,
  list: () => [...venuesKeys.lists()] as const,
  details: () => [...venuesKeys.all, 'detail'] as const,
  detail: (id: number) => [...venuesKeys.details(), id] as const,
};

export function useVenues() {
  return useQuery({
    queryKey: venuesKeys.list(),
    queryFn: () => venuesApi.getVenues(),
  });
}

export function useVenue(id: number) {
  return useQuery({
    queryKey: venuesKeys.detail(id),
    queryFn: () => venuesApi.getVenue(id),
    enabled: !!id,
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateVenueDto) => venuesApi.createVenue(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venuesKeys.list() });
      toast.success('Sede creada correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al crear la sede';
      toast.error(msg);
    },
  });
}

export function useUpdateVenue(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateVenueDto) => venuesApi.updateVenue(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venuesKeys.list() });
      queryClient.invalidateQueries({ queryKey: venuesKeys.detail(id) });
      toast.success('Sede actualizada correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al actualizar la sede';
      toast.error(msg);
    },
  });
}

export function useDeleteVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => venuesApi.deleteVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venuesKeys.list() });
      toast.success('Sede eliminada correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al eliminar la sede';
      toast.error(msg);
    },
  });
}
