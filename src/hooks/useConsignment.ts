import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consignmentApi } from '@/lib/api/dashbar';
import { stockKeys } from './useStock';
import { toast } from 'sonner';

export const consignmentKeys = {
  all: ['consignment'] as const,
  summaries: () => [...consignmentKeys.all, 'summary'] as const,
  summary: (eventId: number, barId: number) =>
    [...consignmentKeys.summaries(), eventId, barId] as const,
};

export function useConsignmentSummary(eventId: number, barId: number) {
  return useQuery({
    queryKey: consignmentKeys.summary(eventId, barId),
    queryFn: () => consignmentApi.getReturnSummary(eventId, barId),
    enabled: !!eventId && !!barId,
  });
}

export function useExecuteReturn(eventId: number, barId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      drinkId,
      supplierId,
      notes,
    }: {
      drinkId: number;
      supplierId: number;
      notes?: string;
    }) => consignmentApi.executeReturn(eventId, barId, drinkId, supplierId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consignmentKeys.summary(eventId, barId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.list(eventId, barId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.summary(eventId, barId) });
      // Also invalidate consignment returns history
      queryClient.invalidateQueries({ 
        queryKey: ['stock', 'consignment-returns', eventId, barId] 
      });
      toast.success('Consignment return executed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error executing return: ${error.message}`);
    },
  });
}

export function useExecuteAllReturns(eventId: number, barId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => consignmentApi.executeAllReturns(eventId, barId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consignmentKeys.summary(eventId, barId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.list(eventId, barId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.summary(eventId, barId) });
      // Also invalidate consignment returns history
      queryClient.invalidateQueries({ 
        queryKey: ['stock', 'consignment-returns', eventId, barId] 
      });
      toast.success('All consignment returns executed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error executing all returns: ${error.message}`);
    },
  });
}
