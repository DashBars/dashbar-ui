import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demoApi } from '@/lib/api/dashbar';
import { toast } from 'sonner';

export const demoKeys = {
  status: (eventId: number) => ['demo', 'status', eventId] as const,
};

export function useDemoSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => demoApi.setup(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      toast.success(data.message);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Error al crear evento demo',
      );
    },
  });
}

export function useDemoSimulationStatus(eventId: number) {
  return useQuery({
    queryKey: demoKeys.status(eventId),
    queryFn: () => demoApi.getStatus(eventId),
    enabled: !!eventId,
    refetchInterval: 3_000, // Poll every 3s to track simulation state
  });
}

export function useStartSimulation(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (intervalMs?: number) =>
      demoApi.startSimulation(eventId, intervalMs),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: demoKeys.status(eventId) });
      toast.success(data.message);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Error al iniciar simulación',
      );
    },
  });
}

export function useStopSimulation(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => demoApi.stopSimulation(eventId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: demoKeys.status(eventId) });
      toast.success(data.message);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Error al detener simulación',
      );
    },
  });
}
