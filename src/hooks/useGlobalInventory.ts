import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { globalInventoryApi } from '@/lib/api/dashbar';
import type {
  GlobalInventory,
  CreateGlobalInventoryDto,
  UpdateGlobalInventoryDto,
} from '@/lib/api/types';
import { toast } from 'sonner';

export const globalInventoryKeys = {
  all: ['global-inventory'] as const,
  lists: () => [...globalInventoryKeys.all, 'list'] as const,
  list: () => [...globalInventoryKeys.lists()] as const,
  details: () => [...globalInventoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...globalInventoryKeys.details(), id] as const,
};

export function useGlobalInventory() {
  return useQuery({
    queryKey: globalInventoryKeys.list(),
    queryFn: () => globalInventoryApi.getAll(),
  });
}

export function useGlobalInventoryItem(id: number) {
  return useQuery({
    queryKey: globalInventoryKeys.detail(id),
    queryFn: () => globalInventoryApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateGlobalInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGlobalInventoryDto) =>
      globalInventoryApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: globalInventoryKeys.list(),
      });
      toast.success('Inventario agregado correctamente');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Error al agregar inventario',
      );
    },
  });
}

export function useUpdateGlobalInventory(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateGlobalInventoryDto) =>
      globalInventoryApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: globalInventoryKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: globalInventoryKeys.detail(id),
      });
      toast.success('Inventario actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Error al actualizar inventario',
      );
    },
  });
}

export function useDeleteGlobalInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => globalInventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: globalInventoryKeys.list(),
      });
      toast.success('Inventario eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Error al eliminar inventario',
      );
    },
  });
}
