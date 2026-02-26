import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/dashbar';
import type { CreateProductDto, UpdateProductDto } from '@/lib/api/types';
import { toast } from 'sonner';

export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (eventId: number, barId?: number) =>
    barId != null
      ? [...productsKeys.lists(), eventId, barId] as const
      : [...productsKeys.lists(), eventId] as const,
  detail: (eventId: number, productId: number) =>
    [...productsKeys.all, 'detail', eventId, productId] as const,
};

export function useEventProducts(eventId: number, barId?: number) {
  return useQuery({
    queryKey: productsKeys.list(eventId, barId),
    queryFn: () => productsApi.getProducts(eventId, barId),
    enabled: !!eventId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useProduct(eventId: number, productId: number) {
  return useQuery({
    queryKey: productsKeys.detail(eventId, productId),
    queryFn: () => productsApi.getProduct(eventId, productId),
    enabled: !!eventId && !!productId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateProduct(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProductDto) => productsApi.create(eventId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      if (variables.barId != null) {
        queryClient.invalidateQueries({
          queryKey: productsKeys.list(eventId, variables.barId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: productsKeys.list(eventId) });
      }
      toast.success('Producto creado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Error al crear producto');
    },
  });
}

export function useUpdateProduct(eventId: number, productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateProductDto) => productsApi.update(eventId, productId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: productsKeys.detail(eventId, productId) 
      });
      toast.success('Producto actualizado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Error al actualizar producto');
    },
  });
}

export function useDeleteProduct(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => productsApi.delete(eventId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      toast.success('Producto eliminado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Error al eliminar producto');
    },
  });
}
