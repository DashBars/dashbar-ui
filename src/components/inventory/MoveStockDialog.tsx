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
import { Textarea } from '@/components/ui/textarea';
import { useBars } from '@/hooks/useBars';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/dashbar';
import type { Stock, MoveStockDto } from '@/lib/api/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MoveStockDialogProps {
  stock: Stock;
  eventId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveStockDialog({
  stock,
  eventId,
  open,
  onOpenChange,
}: MoveStockDialogProps) {
  const { data: bars = [], isLoading: isLoadingBars } = useBars(eventId);
  const queryClient = useQueryClient();
  const [toBarId, setToBarId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const moveMutation = useMutation({
    mutationFn: (dto: MoveStockDto) => stockMovementsApi.move(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['bars'] });
      toast.success('Stock movido correctamente');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al mover stock');
    },
  });

  const resetForm = () => {
    setToBarId('');
    setQuantity('');
    setNotes('');
  };

  useEffect(() => {
    if (open) {
      setQuantity(stock.quantity.toString());
    } else {
      resetForm();
    }
  }, [open, stock]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!toBarId || !quantity) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (quantityNum <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (quantityNum > stock.quantity) {
      toast.error(
        `No puedes mover ${quantityNum} unidades. Solo hay ${stock.quantity} disponibles.`,
      );
      return;
    }

    // Find barId from stock (assuming stock has barId)
    const fromBarId = stock.barId;

    if (parseInt(toBarId, 10) === fromBarId) {
      toast.error('No puedes mover stock a la misma barra');
      return;
    }

    const dto: MoveStockDto = {
      eventId,
      fromBarId,
      toBarId: parseInt(toBarId, 10),
      drinkId: stock.drinkId,
      quantity: quantityNum,
      notes: notes || undefined,
    };

    moveMutation.mutate(dto);
  };

  const availableBars = bars.filter((bar) => bar.id !== stock.barId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mover Stock a Otra Barra</DialogTitle>
          <DialogDescription>
            Mueve stock desde esta barra a otra barra del mismo evento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item</Label>
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="font-medium">{stock.drink?.name || `Drink ${stock.drinkId}`}</p>
                <p className="text-sm text-muted-foreground">
                  {stock.drink?.brand || '—'} - {stock.supplier?.name || `Supplier ${stock.supplierId}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Cantidad disponible: {stock.quantity}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toBarId">
                Barra Destino <span className="text-destructive">*</span>
              </Label>
              <Select
                value={toBarId}
                onValueChange={setToBarId}
                disabled={moveMutation.isPending || isLoadingBars}
              >
                <SelectTrigger id="toBarId">
                  <SelectValue placeholder="Seleccionar barra destino" />
                </SelectTrigger>
                <SelectContent>
                  {availableBars.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay otras barras en este evento
                    </div>
                  ) : (
                    availableBars.map((bar) => (
                      <SelectItem key={bar.id} value={bar.id.toString()}>
                        {bar.name} ({bar.type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Cantidad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={stock.quantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                disabled={moveMutation.isPending}
                placeholder={`Máximo: ${stock.quantity}`}
              />
              <p className="text-xs text-muted-foreground">
                Cantidad disponible: {stock.quantity}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={moveMutation.isPending}
                placeholder="Notas adicionales sobre este movimiento"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={moveMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={moveMutation.isPending || availableBars.length === 0}>
              {moveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Moviendo...
                </>
              ) : (
                'Mover Stock'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
