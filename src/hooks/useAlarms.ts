import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alarmsApi } from '@/lib/api/dashbar';
import type {
  CreateThresholdDto,
  UpdateThresholdDto,
  AlertStatus,
} from '@/lib/api/types';
import { toast } from 'sonner';

// ── Query keys ──

export const alarmsKeys = {
  all: ['alarms'] as const,
  thresholds: (eventId: number) => [...alarmsKeys.all, 'thresholds', eventId] as const,
  alerts: (eventId: number, status?: AlertStatus) =>
    [...alarmsKeys.all, 'alerts', eventId, status ?? 'all'] as const,
};

// ── Threshold hooks ──

export function useThresholds(eventId: number) {
  return useQuery({
    queryKey: alarmsKeys.thresholds(eventId),
    queryFn: () => alarmsApi.getThresholds(eventId),
    enabled: !!eventId,
    refetchInterval: 10_000,
  });
}

export function useCreateThreshold(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateThresholdDto) =>
      alarmsApi.createThreshold(eventId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: alarmsKeys.thresholds(eventId) });
      toast.success('Umbral creado correctamente');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al crear umbral');
    },
  });
}

export function useUpdateThreshold(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      drinkId,
      sellAsWholeUnit,
      dto,
    }: {
      drinkId: number;
      sellAsWholeUnit: boolean;
      dto: UpdateThresholdDto;
    }) => alarmsApi.updateThreshold(eventId, drinkId, sellAsWholeUnit, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: alarmsKeys.thresholds(eventId) });
      toast.success('Umbral actualizado correctamente');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al actualizar umbral');
    },
  });
}

export function useDeleteThreshold(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      drinkId,
      sellAsWholeUnit,
    }: {
      drinkId: number;
      sellAsWholeUnit: boolean;
    }) => alarmsApi.deleteThreshold(eventId, drinkId, sellAsWholeUnit),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: alarmsKeys.thresholds(eventId) });
      toast.success('Umbral eliminado correctamente');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al eliminar umbral');
    },
  });
}

// ── Alert hooks ──

export function useAlerts(eventId: number, status?: AlertStatus) {
  return useQuery({
    queryKey: alarmsKeys.alerts(eventId, status),
    queryFn: () => alarmsApi.getAlerts(eventId, status),
    enabled: !!eventId,
    refetchInterval: 15_000, // poll every 15 s to catch new alerts
  });
}

export function useAcknowledgeAlert(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: number) =>
      alarmsApi.acknowledgeAlert(eventId, alertId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: alarmsKeys.alerts(eventId) });
      toast.success('Alerta reconocida');
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Error al reconocer alerta',
      );
    },
  });
}

export function useForceCheck(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => alarmsApi.forceCheck(eventId),
    onSuccess: (alerts) => {
      qc.invalidateQueries({ queryKey: alarmsKeys.alerts(eventId) });
      if (alerts.length) {
        toast.warning(
          `${alerts.length} alerta${alerts.length !== 1 ? 's' : ''} de stock bajo detectada${alerts.length !== 1 ? 's' : ''}. Revisá las opciones de redistribución.`,
          { duration: 6000 },
        );
      } else {
        toast.success('Todos los stocks están dentro de los umbrales configurados.');
      }
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Error al verificar umbrales',
      );
    },
  });
}
