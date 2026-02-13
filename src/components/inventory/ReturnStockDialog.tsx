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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/dashbar';
import type { Stock, ReturnStockDto } from '@/lib/api/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReturnStockDialogProps {
  stock: Stock;
  eventId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReturnStockDialog({
  stock,
  eventId,
  open,
  onOpenChange,
}: ReturnStockDialogProps) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const returnMutation = useMutation({
    mutationFn: (dto: ReturnStockDto) => stockMovementsApi.return(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['global-inventory'] });
      toast.success('Stock devuelto al inventario global correctamente');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al devolver stock');
    },
  });

  // Convert ml to units (bottles/cans) for display
  const drinkVolume = stock.drink?.volume || 0;
  const availableUnits = drinkVolume > 0
    ? Math.floor(stock.quantity / drinkVolume)
    : stock.quantity;

  const resetForm = () => {
    setQuantity('');
    setNotes('');
  };

  useEffect(() => {
    if (open) {
      setQuantity(availableUnits.toString());
    } else {
      resetForm();
    }
  }, [open, stock, availableUnits]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!quantity) {
      toast.error('Por favor ingresa la cantidad');
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (quantityNum <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (quantityNum > availableUnits) {
      toast.error(
        `No puedes devolver ${quantityNum} unidades. Solo hay ${availableUnits} disponibles.`,
      );
      return;
    }

    // Send quantity in UNITS (bottles) — backend handles ml conversion
    const dto: ReturnStockDto = {
      eventId,
      barId: stock.barId,
      drinkId: stock.drinkId,
      supplierId: stock.supplierId,
      sellAsWholeUnit: stock.sellAsWholeUnit,
      quantity: quantityNum,
      notes: notes || undefined,
    };

    returnMutation.mutate(dto);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Devolver Stock a Inventario Global</DialogTitle>
          <DialogDescription>
            Devuelve stock desde esta barra al inventario global.
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
                  Cantidad disponible: {availableUnits} {availableUnits === 1 ? 'unidad' : 'unidades'}
                  {drinkVolume > 0 && (
                    <span className="text-xs"> ({drinkVolume} ml c/u)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Cantidad a Devolver (unidades) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableUnits}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                disabled={returnMutation.isPending}
                placeholder={`Máximo: ${availableUnits}`}
              />
              <p className="text-xs text-muted-foreground">
                Cantidad disponible: {availableUnits} {availableUnits === 1 ? 'unidad' : 'unidades'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={returnMutation.isPending}
                placeholder="Notas adicionales sobre esta devolución"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={returnMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={returnMutation.isPending}>
              {returnMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Devolviendo...
                </>
              ) : (
                'Devolver Stock'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
