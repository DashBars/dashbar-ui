import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useGlobalInventory } from '@/hooks/useGlobalInventory';
import { useEventRecipes } from '@/hooks/useRecipes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/dashbar';
import type { AssignStockDto, GlobalInventory } from '@/lib/api/types';
import { toast } from 'sonner';
import { Loader2, Package, Beaker, TrendingUp, Info } from 'lucide-react';

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
  const { data: eventRecipes = [] } = useEventRecipes(eventId);

  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [sellAsWholeUnit, setSellAsWholeUnit] = useState(true);
  const [salePrice, setSalePrice] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setSelectedInventoryId('');
      setQuantity('');
      setNotes('');
      setSellAsWholeUnit(true);
      setSalePrice('');
    }
  }, [open]);

  // Find existing direct-sale recipe price for a specific drink
  const getExistingDirectSalePrice = useCallback(
    (drinkId: number): number | null => {
      const match = eventRecipes.find(
        (r) =>
          r.components.length === 1 &&
          r.components[0].drinkId === drinkId &&
          r.components[0].percentage === 100 &&
          r.salePrice > 0,
      );
      return match ? match.salePrice : null;
    },
    [eventRecipes],
  );

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

  // Costo unitario en pesos (convertido desde centavos)
  const unitCostInPesos = selectedItem ? selectedItem.unitCost / 100 : 0;

  // Detect existing price for the selected drink (direct-sale recipe)
  const existingPriceCents = useMemo(() => {
    if (!selectedItem?.drink?.id || !sellAsWholeUnit) return null;
    return getExistingDirectSalePrice(selectedItem.drink.id);
  }, [selectedItem?.drink?.id, sellAsWholeUnit, getExistingDirectSalePrice]);

  const hasExistingPrice = existingPriceCents !== null;
  const isPriceLocked = hasExistingPrice;

  // Auto-fill price when an existing recipe price is found
  useEffect(() => {
    if (hasExistingPrice && sellAsWholeUnit) {
      setSalePrice((existingPriceCents! / 100).toString());
    }
  }, [hasExistingPrice, existingPriceCents, sellAsWholeUnit]);

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
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['bars'] });
      queryClient.invalidateQueries({ queryKey: ['global-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
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

    // Validar precio si es venta directa
    if (sellAsWholeUnit) {
      const price = parseFloat(salePrice);
      if (!price || price <= 0) {
        toast.error('El precio de venta es requerido para venta directa');
        return;
      }
    }

    const dto: AssignStockDto = {
      globalInventoryId: parseInt(selectedInventoryId, 10),
      eventId,
      barId,
      quantity: qty,
      notes: notes || undefined,
      sellAsWholeUnit,
      salePrice: sellAsWholeUnit ? Math.round(parseFloat(salePrice) * 100) : undefined,
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

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
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
                  {selectedItem && (
                    <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                      <span className="text-muted-foreground">Costo unitario:</span>
                      <span className="font-medium">${unitCostInPesos.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Existing price info banner */}
                  {hasExistingPrice && (
                    <div className="flex items-start gap-2 text-sm rounded-lg px-3 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <span>
                          Este producto ya tiene precio asignado: <strong>${(existingPriceCents! / 100).toFixed(2)}</strong>
                        </span>
                        <p className="text-xs mt-1 opacity-80">
                          Para modificar el precio, editá la receta desde "Recetas y Productos".
                        </p>
                      </div>
                    </div>
                  )}

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
                      onChange={(e) => {
                        if (!isPriceLocked) {
                          setSalePrice(e.target.value);
                        }
                      }}
                      disabled={assignMutation.isPending || isPriceLocked}
                      className={isPriceLocked ? 'bg-muted cursor-not-allowed' : ''}
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
                rows={3}
                placeholder="Notas adicionales"
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

