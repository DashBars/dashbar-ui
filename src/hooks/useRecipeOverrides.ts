import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeOverridesApi } from '@/lib/api/dashbar';
import type {
  CreateRecipeOverrideDto,
  UpdateRecipeOverrideDto,
} from '@/lib/api/types';
import { toast } from 'sonner';

// Query keys
export const recipeOverridesKeys = {
  all: ['recipe-overrides'] as const,
  lists: () => [...recipeOverridesKeys.all, 'list'] as const,
  list: (eventId: number, barId: number) =>
    [...recipeOverridesKeys.lists(), eventId, barId] as const,
};

// Hooks
export function useRecipeOverrides(eventId: number, barId: number) {
  return useQuery({
    queryKey: recipeOverridesKeys.list(eventId, barId),
    queryFn: () => recipeOverridesApi.getRecipeOverrides(eventId, barId),
    enabled: !!eventId && !!barId,
  });
}

export function useCreateRecipeOverride(eventId: number, barId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateRecipeOverrideDto) =>
      recipeOverridesApi.createRecipeOverride(eventId, barId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: recipeOverridesKeys.list(eventId, barId),
      });
      toast.success('Ajuste de receta creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear ajuste de receta: ${error.message}`);
    },
  });
}

export function useUpdateRecipeOverride(
  eventId: number,
  barId: number,
  overrideId: number,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateRecipeOverrideDto) =>
      recipeOverridesApi.updateRecipeOverride(eventId, barId, overrideId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: recipeOverridesKeys.list(eventId, barId),
      });
      toast.success('Ajuste de receta actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar ajuste de receta: ${error.message}`);
    },
  });
}

export function useDeleteRecipeOverride(eventId: number, barId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (overrideId: number) =>
      recipeOverridesApi.deleteRecipeOverride(eventId, barId, overrideId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: recipeOverridesKeys.list(eventId, barId),
      });
      toast.success('Ajuste de receta eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar ajuste de receta: ${error.message}`);
    },
  });
}
