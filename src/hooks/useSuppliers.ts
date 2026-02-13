import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/lib/api/dashbar';
import type { CreateSupplierDto, UpdateSupplierDto } from '@/lib/api/types';
import { toast } from 'sonner';

export const suppliersKeys = {
  all: ['suppliers'] as const,
  lists: () => [...suppliersKeys.all, 'list'] as const,
  list: () => [...suppliersKeys.lists()] as const,
  details: () => [...suppliersKeys.all, 'detail'] as const,
  detail: (id: number) => [...suppliersKeys.details(), id] as const,
};

export function useSuppliers() {
  return useQuery({
    queryKey: suppliersKeys.list(),
    queryFn: () => suppliersApi.findAll(),
  });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: suppliersKeys.detail(id),
    queryFn: () => suppliersApi.findOne(id),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupplierDto) => suppliersApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.list() });
      toast.success('Proveedor creado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al crear el proveedor';
      toast.error(msg);
    },
  });
}

export function useUpdateSupplier(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSupplierDto) => suppliersApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.list() });
      queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(id) });
      toast.success('Proveedor actualizado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al actualizar el proveedor';
      toast.error(msg);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => suppliersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.list() });
      toast.success('Proveedor eliminado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al eliminar el proveedor';
      toast.error(msg);
    },
  });
}
