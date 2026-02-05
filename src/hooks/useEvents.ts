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
      toast.success('Event created successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error creating event';
      toast.error(errorMessage);
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
      toast.success('Event updated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error updating event';
      toast.error(errorMessage);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
      toast.success('Event deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting event';
      toast.error(errorMessage);
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
      toast.success('Event started successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error starting event';
      toast.error(errorMessage);
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
      toast.success('Event activated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error activating event';
      toast.error(errorMessage);
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
      toast.success('Event finished successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error finishing event';
      toast.error(errorMessage);
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
      toast.success('Event archived successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error archiving event';
      toast.error(errorMessage);
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
      toast.success('Event unarchived successfully');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error unarchiving event';
      toast.error(errorMessage);
    },
  });
}
