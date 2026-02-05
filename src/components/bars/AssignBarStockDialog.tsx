import { useEffect, useMemo, useState } from 'react';
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
import { useGlobalInventory } from '@/hooks/useGlobalInventory';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/dashbar';
import type { AssignStockDto, GlobalInventory } from '@/lib/api/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AssignBarStockDialogProps {
  eventId: number;
  barId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignBarStockDialog({
  eventId,
  barId,
  open,
  onOpenChange,
}: AssignBarStockDialogProps) {
  const queryClient = useQueryClient();
  const { data: inventory = [], isLoading } = useGlobalInventory();

  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setSelectedInventoryId('');
      setQuantity('');
      setNotes('');
    }
  }, [open]);

  const availableInventory = useMemo(() => {
    return inventory
      .map((i) => ({
        ...i,
        availableQuantity: i.totalQuantity - i.allocatedQuantity,
      }))
      .filter((i) => i.availableQuantity > 0);
  }, [inventory]);

  const selectedItem: (GlobalInventory & { availableQuantity: number }) | undefined =
    availableInventory.find((i) => i.id === Number(selectedInventoryId));

  const assignMutation = useMutation({
    mutationFn: (dto: AssignStockDto) => stockMovementsApi.assign(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['bars'] });
      queryClient.invalidateQueries({ queryKey: ['global-inventory'] });
      toast.success('Stock asignado correctamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al asignar stock');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedInventoryId) {
      toast.error('Seleccioná un item del inventario global');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (selectedItem && qty > selectedItem.availableQuantity) {
      toast.error(
        `No podés asignar ${qty}. Disponible: ${selectedItem.availableQuantity}`,
      );
      return;
    }

    const dto: AssignStockDto = {
      globalInventoryId: parseInt(selectedInventoryId, 10),
      eventId,
      barId,
      quantity: qty,
      notes: notes || undefined,
    };

    assignMutation.mutate(dto);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Asignar stock desde Inventario Global</DialogTitle>
            <DialogDescription>
              En las barras solo podés cargar stock que ya exista en el inventario global.
              Podés asignarlo parcialmente y luego devolverlo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inventoryItem">
                Item del inventario global <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedInventoryId}
                onValueChange={setSelectedInventoryId}
                disabled={isLoading || assignMutation.isPending}
              >
                <SelectTrigger id="inventoryItem">
                  <SelectValue
                    placeholder={
                      isLoading ? 'Cargando inventario...' : 'Seleccionar item'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableInventory.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay stock disponible en el inventario global
                    </div>
                  ) : (
                    availableInventory.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.drink?.name} {item.drink?.brand ? `(${item.drink.brand})` : ''}{' '}
                        — {item.supplier?.name || 'Sin proveedor'} — disp: {item.availableQuantity}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <div className="rounded-lg border p-3 bg-muted/40 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponible</span>
                  <span className="font-medium">{selectedItem.availableQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignado</span>
                  <span className="font-medium">{selectedItem.allocatedQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{selectedItem.totalQuantity}</span>
                </div>
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
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={assignMutation.isPending}
                placeholder={selectedItem ? `Máximo: ${selectedItem.availableQuantity}` : 'Cantidad'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={assignMutation.isPending}
                rows={3}
                placeholder="Notas adicionales"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                assignMutation.isPending ||
                !selectedInventoryId ||
                availableInventory.length === 0
              }
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                'Asignar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

