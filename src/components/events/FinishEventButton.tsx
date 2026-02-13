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
        Finalizar Evento
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Evento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés finalizar "{event.name}"? Una vez finalizado, se habilitarán los reportes y análisis para este evento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? 'Finalizando...' : 'Finalizar Evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
