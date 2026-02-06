import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useVenues } from '@/hooks/useVenues';
import type { Event, CreateEventDto, UpdateEventDto } from '@/lib/api/types';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface EventFormDialogProps {
  event?: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventFormDialog({
  event,
  open,
  onOpenChange,
}: EventFormDialogProps) {
  const isEdit = !!event;
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent(
    event?.id || 0,
  );
  const { data: venues = [], isLoading: isLoadingVenues } = useVenues();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venueId, setVenueId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  useEffect(() => {
    if (open) {
      setName(event?.name || '');
      setDescription(event?.description || '');
      setVenueId(event?.venueId?.toString() || '');
      
      // Parse scheduledStartAt into date and time
      if (event?.scheduledStartAt) {
        const date = new Date(event.scheduledStartAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setScheduledDate(`${year}-${month}-${day}`);
        setScheduledTime(`${hours}:${minutes}`);
      } else {
        setScheduledDate('');
        setScheduledTime('');
      }
    } else {
      setScheduledDate('');
      setScheduledTime('');
    }
  }, [open, event]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isEdit && !venueId) {
      toast.error('Please select a venue');
      return;
    }

    // Combine date and time into ISO string
    const scheduledStartAt = scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      : undefined;

    // Validate that scheduled start is in the future
    if (scheduledStartAt) {
      const scheduledDateObj = new Date(scheduledStartAt);
      const now = new Date();
      if (scheduledDateObj <= now) {
        toast.error('Scheduled start time must be in the future');
        return;
      }
    }

    if (isEdit) {
      const dto: UpdateEventDto = {
        name,
        description: description || undefined,
        venueId: venueId ? parseInt(venueId, 10) : undefined,
        scheduledStartAt,
      };
      updateEvent(dto, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      const dto: CreateEventDto = {
        name,
        description: description || undefined,
        venueId: parseInt(venueId, 10),
        scheduledStartAt,
      };
      createEvent(dto, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Event' : 'New Event'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update event information.'
              : 'Create a new event. You can start it later when ready.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Event name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">
                Venue <span className="text-destructive">*</span>
              </Label>
              {venues.length === 0 && !isLoadingVenues ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay venues.{' '}
                  <Link
                    to="/venues"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => onOpenChange(false)}
                  >
                    Crear uno
                  </Link>
                </p>
              ) : (
                <Select value={venueId} onValueChange={setVenueId} disabled={isSubmitting || isLoadingVenues}>
                  <SelectTrigger id="venue">
                    <SelectValue placeholder={isLoadingVenues ? "Cargando..." : "Seleccionar venue"} />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id.toString()}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Start Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // No dates in the past
                  disabled={isSubmitting || (isEdit && event?.status !== 'upcoming')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Scheduled Start Time</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  disabled={isSubmitting || (isEdit && event?.status !== 'upcoming')}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Optional. The event will remain "upcoming" until you manually activate it. When you activate it, the actual start time will be recorded.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
