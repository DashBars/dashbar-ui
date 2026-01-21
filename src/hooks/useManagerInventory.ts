import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerInventoryApi } from '@/lib/api/dashbar';
import type {
  CreateManagerInventoryDto,
  UpdateManagerInventoryDto,
  TransferToBarDto,
} from '@/lib/api/types';
import { toast } from 'sonner';

export const managerInventoryKeys = {
  all: ['manager-inventory'] as const,
  lists: () => [...managerInventoryKeys.all, 'list'] as const,
  list: () => [...managerInventoryKeys.lists()] as const,
  details: () => [...managerInventoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...managerInventoryKeys.details(), id] as const,
  allocations: (id: number) => [...managerInventoryKeys.detail(id), 'allocations'] as const,
};

export function useManagerInventory() {
  return useQuery({
    queryKey: managerInventoryKeys.list(),
    queryFn: () => managerInventoryApi.findAll(),
  });
}

export function useManagerInventoryItem(id: number) {
  return useQuery({
    queryKey: managerInventoryKeys.detail(id),
    queryFn: () => managerInventoryApi.findOne(id),
    enabled: !!id,
  });
}

export function useCreateManagerInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateManagerInventoryDto) =>
      managerInventoryApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerInventoryKeys.list() });
      toast.success('Insumo creado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error al crear insumo';
      toast.error(errorMessage);
    },
  });
}

export function useUpdateManagerInventory(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateManagerInventoryDto) =>
      managerInventoryApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerInventoryKeys.list() });
      queryClient.invalidateQueries({ queryKey: managerInventoryKeys.detail(id) });
      toast.success('Insumo actualizado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error al actualizar insumo';
      toast.error(errorMessage);
    },
  });
}

export function useDeleteManagerInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => managerInventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerInventoryKeys.list() });
      toast.success('Insumo eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error al eliminar insumo';
      toast.error(errorMessage);
    },
  });
}

export function useTransferToBar(inventoryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: TransferToBarDto) =>
      managerInventoryApi.transferToBar(inventoryId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerInventoryKeys.list() });
      queryClient.invalidateQueries({
        queryKey: managerInventoryKeys.detail(inventoryId),
      });
      queryClient.invalidateQueries({
        queryKey: managerInventoryKeys.allocations(inventoryId),
      });
      toast.success('Insumo transferido exitosamente a la barra');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al transferir insumo';
      toast.error(errorMessage);
    },
  });
}

export function useInventoryAllocations(id: number) {
  return useQuery({
    queryKey: managerInventoryKeys.allocations(id),
    queryFn: () => managerInventoryApi.getAllocations(id),
    enabled: !!id,
  });
}
