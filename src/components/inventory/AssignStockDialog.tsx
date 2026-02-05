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
import { Switch } from '@/components/ui/switch';
import { useEvents } from '@/hooks/useEvents';
import { useBars } from '@/hooks/useBars';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/dashbar';
import type { GlobalInventory, AssignStockDto } from '@/lib/api/types';
import { Loader2, Package, Beaker, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

interface AssignStockDialogProps {
  inventory: GlobalInventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignStockDialog({
  inventory,
  open,
  onOpenChange,
}: AssignStockDialogProps) {
  const { data: events = [] } = useEvents();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedBarId, setSelectedBarId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [sellAsWholeUnit, setSellAsWholeUnit] = useState(true);
  const [salePrice, setSalePrice] = useState<string>('');

  const eventIdNum = selectedEventId ? parseInt(selectedEventId, 10) : 0;
  const { data: bars = [], isLoading: isLoadingBars } = useBars(eventIdNum);

  const availableQuantity = inventory.totalQuantity - inventory.allocatedQuantity;

  // Costo unitario en pesos (convertido desde centavos)
  const unitCostInPesos = inventory.unitCost / 100;

  // Cálculo del margen de ganancia
  const profitMargin = useMemo(() => {
    const salePriceNum = parseFloat(salePrice);
    if (!salePriceNum || salePriceNum <= 0 || unitCostInPesos <= 0) return null;
    
    const profit = salePriceNum - unitCostInPesos;
    const margin = (profit / unitCostInPesos) * 100;
    return {
      profit,
      margin,
      isPositive: margin > 0,
    };
  }, [salePrice, unitCostInPesos]);

  const assignMutation = useMutation({
    mutationFn: (dto: AssignStockDto) => stockMovementsApi.assign(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['bars'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Stock asignado correctamente');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Error al asignar stock',
      );
    },
  });

  const resetForm = () => {
    setSelectedEventId('');
    setSelectedBarId('');
    setQuantity('');
    setNotes('');
    setSellAsWholeUnit(true);
    setSalePrice('');
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedEventId || !selectedBarId || !quantity) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (quantityNum <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (quantityNum > availableQuantity) {
      toast.error(
        `No puedes asignar ${quantityNum} unidades. Solo hay ${availableQuantity} disponibles.`,
      );
      return;
    }

    // Validar precio si es venta directa
    if (sellAsWholeUnit) {
      const price = parseFloat(salePrice);
      if (!price || price <= 0) {
        toast.error('El precio de venta es requerido para venta directa');
        return;
      }
    }

    const dto: AssignStockDto = {
      globalInventoryId: inventory.id,
      eventId: parseInt(selectedEventId, 10),
      barId: parseInt(selectedBarId, 10),
      quantity: quantityNum,
      notes: notes || undefined,
      sellAsWholeUnit,
      salePrice: sellAsWholeUnit ? Math.round(parseFloat(salePrice) * 100) : undefined,
    };

    assignMutation.mutate(dto);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Stock a Barra</DialogTitle>
          <DialogDescription>
            Asigna stock desde el inventario global a una barra específica.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Item</Label>
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="font-medium">{inventory.drink.name}</p>
                <p className="text-sm text-muted-foreground">
                  {inventory.drink.brand} - {inventory.supplier?.name || 'Sin proveedor'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Disponible: {availableQuantity} / {inventory.totalQuantity}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventId">
                Evento <span className="text-destructive">*</span>
              </Label>
              {events.filter((e) => e.status === 'upcoming' || e.status === 'active').length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay eventos activos.{' '}
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
                  value={selectedEventId}
                  onValueChange={(value) => {
                    setSelectedEventId(value);
                    setSelectedBarId(''); // Reset bar when event changes
                  }}
                  disabled={assignMutation.isPending}
                >
                  <SelectTrigger id="eventId">
                    <SelectValue placeholder="Seleccionar evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events
                      .filter((e) => e.status === 'upcoming' || e.status === 'active')
                      .map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="barId">
                Barra <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedBarId}
                onValueChange={setSelectedBarId}
                disabled={assignMutation.isPending || !selectedEventId || isLoadingBars}
              >
                <SelectTrigger id="barId">
                  <SelectValue placeholder="Seleccionar barra" />
                </SelectTrigger>
                <SelectContent>
                  {bars.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {selectedEventId
                        ? 'No hay barras en este evento'
                        : 'Selecciona un evento primero'}
                    </div>
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
                disabled={assignMutation.isPending}
                placeholder={`Máximo: ${availableQuantity}`}
              />
              <p className="text-xs text-muted-foreground">
                Cantidad disponible: {availableQuantity}
              </p>
            </div>

            {/* Toggle para venta directa vs componente de receta */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sellAsWholeUnit ? (
                    <Package className="h-5 w-5 text-green-600" />
                  ) : (
                    <Beaker className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <Label htmlFor="sellAsWholeUnit" className="cursor-pointer text-sm font-medium">
                      {sellAsWholeUnit ? 'Venta directa' : 'Componente para recetas'}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sellAsWholeUnit
                        ? 'Se vende como unidad completa (ej: botella de agua)'
                        : 'Se usa como ingrediente en recetas'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="sellAsWholeUnit"
                  checked={sellAsWholeUnit}
                  onCheckedChange={setSellAsWholeUnit}
                  disabled={assignMutation.isPending}
                />
              </div>

              {sellAsWholeUnit && (
                <div className="space-y-3 pt-3 border-t">
                  {/* Helper: Costo unitario */}
                  <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Costo unitario:</span>
                    <span className="font-medium">${unitCostInPesos.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salePrice">
                      Precio de venta ($) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="salePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      disabled={assignMutation.isPending}
                      placeholder="Ej: 5.00"
                      required={sellAsWholeUnit}
                    />
                  </div>

                  {/* Helper: Margen de ganancia */}
                  {profitMargin && (
                    <div className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                      profitMargin.isPositive 
                        ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' 
                        : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`h-4 w-4 ${profitMargin.isPositive ? '' : 'rotate-180'}`} />
                        <span>Margen de ganancia:</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{profitMargin.margin.toFixed(1)}%</span>
                        <span className="text-xs ml-1">
                          (${profitMargin.profit.toFixed(2)} por unidad)
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Este insumo aparecerá automáticamente como producto disponible para venta
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={assignMutation.isPending}
                placeholder="Notas adicionales sobre esta asignación"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={assignMutation.isPending}>
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                'Asignar Stock'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
