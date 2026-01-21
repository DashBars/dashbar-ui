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
import { useFinishEvent } from '@/hooks/useEvents';
import type { Event } from '@/lib/api/types';
import { Square } from 'lucide-react';

interface FinishEventButtonProps {
  event: Event;
}

export function FinishEventButton({ event }: FinishEventButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate: finishEvent, isPending } = useFinishEvent();

  const handleConfirm = () => {
    finishEvent(event.id, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} disabled={isPending} variant="outline">
        <Square className="mr-2 h-4 w-4" />
        Finish Event
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to finish "{event.name}"? Once finished,
              reports and analytics will be enabled for this event.
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
              {isPending ? 'Finishing...' : 'Finish Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
