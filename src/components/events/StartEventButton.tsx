import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStartEvent } from '@/hooks/useEvents';
import type { Event } from '@/lib/api/types';
import { Play } from 'lucide-react';

interface StartEventButtonProps {
  event: Event;
}

export function StartEventButton({ event }: StartEventButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate: startEvent, isPending } = useStartEvent();

  const handleConfirm = () => {
    startEvent(event.id, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} disabled={isPending}>
        <Play className="mr-2 h-4 w-4" />
        Start Event
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to start "{event.name}"? Once started,
              recipes and prices will be locked and cannot be modified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? 'Starting...' : 'Start Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
