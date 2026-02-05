import { useQuery } from '@tanstack/react-query';
import { cocktailsApi } from '@/lib/api/dashbar';

export const cocktailsKeys = {
  all: ['cocktails'] as const,
  list: (includeInactive?: boolean) =>
    [...cocktailsKeys.all, includeInactive ?? false] as const,
};

export function useCocktails(includeInactive = false) {
  return useQuery({
    queryKey: cocktailsKeys.list(includeInactive),
    queryFn: () => cocktailsApi.getCocktails(includeInactive),
  });
}
