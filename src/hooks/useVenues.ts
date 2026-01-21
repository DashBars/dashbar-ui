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
      toast.success('Venue created successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error creating venue';
      toast.error(errorMessage);
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
      toast.success('Venue updated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error updating venue';
      toast.error(errorMessage);
    },
  });
}

export function useDeleteVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => venuesApi.deleteVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venuesKeys.list() });
      toast.success('Venue deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting venue';
      toast.error(errorMessage);
    },
  });
}
