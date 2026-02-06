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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTransferToBar } from '@/hooks/useManagerInventory';
import { useEvents } from '@/hooks/useEvents';
import { useBars } from '@/hooks/useBars';
import type { ManagerInventory, TransferToBarDto } from '@/lib/api/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface TransferToBarDialogProps {
  inventory: ManagerInventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedEventId?: number;
  preselectedBarId?: number;
}

export function TransferToBarDialog({
  inventory,
  open,
  onOpenChange,
  preselectedEventId,
  preselectedBarId,
}: TransferToBarDialogProps) {
  const { mutate: transfer, isPending } = useTransferToBar(inventory.id);
  const { data: events = [] } = useEvents();
  const [eventId, setEventId] = useState<string>(
    preselectedEventId?.toString() || '',
  );
  const [barId, setBarId] = useState<string>(
    preselectedBarId?.toString() || '',
  );
  const [quantity, setQuantity] = useState<string>('');

  const eventIdNum = eventId ? parseInt(eventId, 10) : 0;
  const { data: bars = [], isLoading: isLoadingBars } = useBars(eventIdNum);

  useEffect(() => {
    if (open) {
      if (preselectedEventId) {
        setEventId(preselectedEventId.toString());
      } else {
        setEventId('');
      }
      if (preselectedBarId) {
        setBarId(preselectedBarId.toString());
      } else {
        setBarId('');
      }
      setQuantity('');
    }
  }, [open, preselectedEventId, preselectedBarId]);

  const availableQuantity = inventory.totalQuantity - inventory.allocatedQuantity;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const qty = parseInt(quantity, 10);
    if (qty > availableQuantity) {
      toast.error(
        `No puedes transferir ${qty} unidades. Solo hay ${availableQuantity} disponibles.`,
      );
      return;
    }

    const dto: TransferToBarDto = {
      eventId: parseInt(eventId, 10),
      barId: parseInt(barId, 10),
      quantity: qty,
    };

    transfer(dto, {
      onSuccess: () => onOpenChange(false),
    });
  };

  // Fetch bars when event is selected
  useEffect(() => {
    if (eventId) {
      // Reset bar selection when event changes
      setBarId('');
    }
  }, [eventId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir a Barra</DialogTitle>
          <DialogDescription>
            Transfiere {inventory.drink.name} del inventario global a una barra
            específica.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disponible:</span>
                <span className="font-medium">{availableQuantity} unidades</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{inventory.totalQuantity} unidades</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Asignada:</span>
                <span className="font-medium">{inventory.allocatedQuantity} unidades</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventId">
                Evento <span className="text-destructive">*</span>
              </Label>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay eventos.{' '}
                  <Link
                    to="/events"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => onOpenChange(false)}
                  >
                    Crear uno
                  </Link>
                </p>
              ) : (
                <Select
                  value={eventId}
                  onValueChange={setEventId}
                  disabled={isPending}
                >
                  <SelectTrigger id="eventId">
                    <SelectValue placeholder="Seleccionar evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {eventId && (
              <div className="space-y-2">
                <Label htmlFor="barId">
                  Barra <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={barId}
                  onValueChange={setBarId}
                  disabled={isPending || !eventId || isLoadingBars}
                >
                  <SelectTrigger id="barId">
                    <SelectValue placeholder={isLoadingBars ? "Cargando barras..." : "Seleccionar barra"} />
                  </SelectTrigger>
                  <SelectContent>
                    {bars.length === 0 ? (
                      <SelectItem value="no-bars" disabled>
                        No hay barras en este evento
                      </SelectItem>
                    ) : (
                      bars.map((bar) => (
                        <SelectItem key={bar.id} value={bar.id.toString()}>
                          {bar.name} ({bar.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Cantidad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                disabled={isPending || !eventId || !barId}
                placeholder={`Máximo ${availableQuantity}`}
              />
              <p className="text-xs text-muted-foreground">
                Máximo: {availableQuantity} unidades disponibles
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !eventId || !barId || !quantity}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transfiriendo...
                </>
              ) : (
                'Transferir'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
