import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { drinksApi } from '@/lib/api/dashbar';
import type { CreateDrinkDto, UpdateDrinkDto } from '@/lib/api/types';
import { toast } from 'sonner';

export const drinksKeys = {
  all: ['drinks'] as const,
  lists: () => [...drinksKeys.all, 'list'] as const,
  list: () => [...drinksKeys.lists()] as const,
  searches: () => [...drinksKeys.all, 'search'] as const,
  search: (query: string) => [...drinksKeys.searches(), query] as const,
  details: () => [...drinksKeys.all, 'detail'] as const,
  detail: (id: number) => [...drinksKeys.details(), id] as const,
};

export function useDrinks() {
  return useQuery({
    queryKey: drinksKeys.list(),
    queryFn: () => drinksApi.findAll(),
  });
}

export function useSearchDrinks(query: string) {
  return useQuery({
    queryKey: drinksKeys.search(query),
    queryFn: () => drinksApi.search(query),
    enabled: query.length > 0,
  });
}

export function useDrink(id: number) {
  return useQuery({
    queryKey: drinksKeys.detail(id),
    queryFn: () => drinksApi.findOne(id),
    enabled: !!id,
  });
}

export function useCreateDrink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDrinkDto) => drinksApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: drinksKeys.list() });
      toast.success('Insumo creado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error al crear insumo';
      toast.error(errorMessage);
    },
  });
}

export function useUpdateDrink(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateDrinkDto) => drinksApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: drinksKeys.list() });
      queryClient.invalidateQueries({ queryKey: drinksKeys.detail(id) });
      toast.success('Insumo actualizado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error al actualizar insumo';
      toast.error(errorMessage);
    },
  });
}

export function useDeleteDrink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => drinksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: drinksKeys.list() });
      toast.success('Insumo eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error al eliminar insumo';
      toast.error(errorMessage);
    },
  });
}
