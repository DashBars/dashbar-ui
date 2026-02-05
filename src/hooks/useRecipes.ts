import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from '@/lib/api/dashbar';
import type { BarType, CreateRecipeDto, UpdateRecipeDto } from '@/lib/api/types';
import { toast } from 'sonner';

export const recipesKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipesKeys.all, 'list'] as const,
  list: (eventId: number) => [...recipesKeys.lists(), eventId] as const,
};

export function useEventRecipes(eventId: number) {
  return useQuery({
    queryKey: recipesKeys.list(eventId),
    queryFn: () => recipesApi.getRecipes(eventId),
    enabled: !!eventId,
  });
}

export function useCreateRecipe(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRecipeDto) => recipesApi.createRecipe(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipesKeys.list(eventId) });
      toast.success('Receta creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear receta');
    },
  });
}

export function useUpdateRecipe(eventId: number, recipeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateRecipeDto) => recipesApi.updateRecipe(eventId, recipeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipesKeys.list(eventId) });
      toast.success('Receta actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar receta');
    },
  });
}

export function useDeleteRecipe(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: number) => recipesApi.deleteRecipe(eventId, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipesKeys.list(eventId) });
      toast.success('Receta eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar receta');
    },
  });
}

export function useCopyRecipes(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ from, to }: { from: BarType; to: BarType }) =>
      recipesApi.copyRecipes(eventId, from, to),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipesKeys.list(eventId) });
      toast.success('Recetas copiadas correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al copiar recetas');
    },
  });
}

