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
        Iniciar Evento
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Evento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés iniciar "{event.name}"? Una vez iniciado, las recetas y precios se bloquearán y no podrán modificarse.
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
              {isPending ? 'Iniciando...' : 'Iniciar Evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
