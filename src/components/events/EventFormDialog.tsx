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
  const [startedAt, setStartedAt] = useState<string>('');

  useEffect(() => {
    if (open) {
      setName(event?.name || '');
      setDescription(event?.description || '');
      setVenueId(event?.venueId?.toString() || '');
      // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
      // Only show if event hasn't been manually started (i.e., if it's still upcoming)
      if (event?.startedAt) {
        const date = new Date(event.startedAt);
        const now = new Date();
        // Only allow editing if the date is in the future (scheduled date)
        if (date > now) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          setStartedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
        } else {
          // Event has been manually started, don't show the field
          setStartedAt('');
        }
      } else {
        setStartedAt('');
      }
    } else {
      setStartedAt('');
    }
  }, [open, event]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isEdit && !venueId) {
      toast.error('Please select a venue');
      return;
    }

    if (isEdit) {
      const dto: UpdateEventDto = {
        name,
        description: description || undefined,
        venueId: venueId ? parseInt(venueId, 10) : undefined,
        startedAt: startedAt ? new Date(startedAt).toISOString() : undefined,
      };
      updateEvent(dto, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      const dto: CreateEventDto = {
        name,
        description: description || undefined,
        venueId: parseInt(venueId, 10),
        startedAt: startedAt ? new Date(startedAt).toISOString() : undefined,
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
              <Select value={venueId} onValueChange={setVenueId} disabled={isSubmitting || isLoadingVenues}>
                <SelectTrigger id="venue">
                  <SelectValue placeholder={isLoadingVenues ? "Loading venues..." : "Select a venue"} />
                </SelectTrigger>
                <SelectContent>
                  {venues.length === 0 && !isLoadingVenues ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No venues available. Create one first.
                    </div>
                  ) : (
                    venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id.toString()}>
                        {venue.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startedAt">Scheduled Start Date & Time</Label>
              <Input
                id="startedAt"
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                disabled={isSubmitting || (isEdit && event?.startedAt && new Date(event.startedAt) <= new Date())}
              />
              <p className="text-xs text-muted-foreground">
                Optional. The event will remain "upcoming" until you manually start it. When you start it, this will be overwritten with the actual start time.
              </p>
            </div>
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
