import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api/dashbar';
import type { CreateEventDto, UpdateEventDto, ActivateEventDto } from '@/lib/api/types';
import { toast } from 'sonner';

export const eventsKeys = {
  all: ['events'] as const,
  lists: () => [...eventsKeys.all, 'list'] as const,
  list: () => [...eventsKeys.lists()] as const,
  details: () => [...eventsKeys.all, 'detail'] as const,
  detail: (id: number) => [...eventsKeys.details(), id] as const,
};

export function useEvents() {
  return useQuery({
    queryKey: eventsKeys.list(),
    queryFn: () => eventsApi.getEvents(),
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: eventsKeys.detail(id),
    queryFn: () => eventsApi.getEvent(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEventDto) => eventsApi.createEvent(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
      toast.success('Evento creado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al crear el evento';
      toast.error(msg);
    },
  });
}

export function useUpdateEvent(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateEventDto) => eventsApi.updateEvent(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(id) });
      toast.success('Evento actualizado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al actualizar el evento';
      toast.error(msg);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
      toast.success('Evento eliminado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al eliminar el evento';
      toast.error(msg);
    },
  });
}

export function useStartEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsApi.startEvent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(id) });
      toast.success('Evento iniciado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al iniciar el evento';
      toast.error(msg);
    },
  });
}

export function useActivateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActivateEventDto }) =>
      eventsApi.activateEvent(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(id) });
      toast.success('Evento activado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al activar el evento';
      toast.error(msg);
    },
  });
}

export function useFinishEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsApi.finishEvent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(id) });
      toast.success('Evento finalizado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al finalizar el evento';
      toast.error(msg);
    },
  });
}

export function useArchiveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsApi.archiveEvent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(id) });
      toast.success('Evento archivado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al archivar el evento';
      toast.error(msg);
    },
  });
}

export function useUnarchiveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsApi.unarchiveEvent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(id) });
      toast.success('Evento desarchivado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Error al desarchivar el evento';
      toast.error(msg);
    },
  });
}
