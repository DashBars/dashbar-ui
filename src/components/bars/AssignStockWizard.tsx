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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGlobalInventory } from '@/hooks/useGlobalInventory';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/dashbar';
import type { AssignStockDto, Bar, GlobalInventory } from '@/lib/api/types';
import { toast } from 'sonner';
import {
  Loader2,
  Package,
  Beaker,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  TrendingUp,
} from 'lucide-react';

interface AssignStockWizardProps {
  eventId: number;
  bars: Bar[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemConfig {
  globalInventoryId: number;
  drink: { name: string; brand: string; volume: number };
  supplier: string;
  availableQuantity: number;
  unitCost: number;
  currency: string;
  quantity: string;
  sellAsWholeUnit: boolean;
  salePrice: string;
}

export function AssignStockWizard({
  eventId,
  bars,
  open,
  onOpenChange,
}: AssignStockWizardProps) {
  const queryClient = useQueryClient();
  const { data: inventory = [], isLoading: isLoadingInventory } = useGlobalInventory();

  const [step, setStep] = useState(1);
  const [selectedBarId, setSelectedBarId] = useState<number | null>(null);
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<Set<number>>(new Set());
  const [itemConfigs, setItemConfigs] = useState<Map<number, ItemConfig>>(new Map());
  const [searchFilter, setSearchFilter] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedBarId(null);
      setSelectedInventoryIds(new Set());
      setItemConfigs(new Map());
      setSearchFilter('');
      setIsAssigning(false);
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

  const filteredInventory = useMemo(() => {
    if (!searchFilter) return availableInventory;
    const lower = searchFilter.toLowerCase();
    return availableInventory.filter(
      (i) =>
        i.drink?.name.toLowerCase().includes(lower) ||
        i.drink?.brand.toLowerCase().includes(lower) ||
        i.supplier?.name.toLowerCase().includes(lower),
    );
  }, [availableInventory, searchFilter]);

  const selectedBar = bars.find((b) => b.id === selectedBarId);

  const toggleInventoryItem = useCallback((id: number) => {
    setSelectedInventoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedInventoryIds((prev) => {
      const next = new Set(prev);
      for (const item of filteredInventory) {
        next.add(item.id);
      }
      return next;
    });
  }, [filteredInventory]);

  const deselectAll = useCallback(() => {
    setSelectedInventoryIds(new Set());
  }, []);

  // Build item configs when moving to step 3
  const initializeConfigs = useCallback(() => {
    const configs = new Map<number, ItemConfig>();
    for (const id of selectedInventoryIds) {
      const inv = availableInventory.find((i) => i.id === id);
      if (inv) {
        configs.set(id, {
          globalInventoryId: id,
          drink: {
            name: inv.drink?.name || '',
            brand: inv.drink?.brand || '',
            volume: inv.drink?.volume || 0,
          },
          supplier: inv.supplier?.name || 'Sin proveedor',
          availableQuantity: inv.availableQuantity,
          unitCost: inv.unitCost,
          currency: inv.currency || 'ARS',
          quantity: '',
          sellAsWholeUnit: false,
          salePrice: '',
        });
      }
    }
    setItemConfigs(configs);
  }, [selectedInventoryIds, availableInventory]);

  const updateConfig = useCallback(
    (id: number, field: keyof ItemConfig, value: string | boolean) => {
      setItemConfigs((prev) => {
        const next = new Map(prev);
        const config = next.get(id);
        if (config) {
          next.set(id, { ...config, [field]: value });
        }
        return next;
      });
    },
    [],
  );

  const goToStep = (newStep: number) => {
    if (newStep === 3 && step === 2) {
      initializeConfigs();
    }
    setStep(newStep);
  };

  // Validate step 3 before submitting
  const validateConfigs = (): boolean => {
    for (const [, config] of itemConfigs) {
      const qty = parseInt(config.quantity, 10);
      if (!qty || qty <= 0) {
        toast.error(`Ingresá la cantidad para ${config.drink.name}`);
        return false;
      }
      if (qty > config.availableQuantity) {
        toast.error(
          `${config.drink.name}: no podés asignar ${qty}. Disponible: ${config.availableQuantity}`,
        );
        return false;
      }
      if (config.sellAsWholeUnit) {
        const price = parseFloat(config.salePrice);
        if (!price || price <= 0) {
          toast.error(`Ingresá el precio de venta para ${config.drink.name}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleAssignAll = async () => {
    if (!selectedBarId || !validateConfigs()) return;

    setIsAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    for (const [, config] of itemConfigs) {
      const dto: AssignStockDto = {
        globalInventoryId: config.globalInventoryId,
        eventId,
        barId: selectedBarId,
        quantity: parseInt(config.quantity, 10),
        sellAsWholeUnit: config.sellAsWholeUnit,
        salePrice: config.sellAsWholeUnit
          ? Math.round(parseFloat(config.salePrice) * 100)
          : undefined,
      };

      try {
        await stockMovementsApi.assign(dto);
        successCount++;
      } catch (error: any) {
        errorCount++;
        toast.error(
          `Error al asignar ${config.drink.name}: ${error?.response?.data?.message || error.message}`,
        );
      }
    }

    setIsAssigning(false);

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['bars'] });
      queryClient.invalidateQueries({ queryKey: ['global-inventory'] });
      toast.success(
        `${successCount} item${successCount > 1 ? 's' : ''} asignado${successCount > 1 ? 's' : ''} a ${selectedBar?.name}`,
      );
    }

    if (errorCount === 0) {
      onOpenChange(false);
    }
  };

  const formatCurrency = (amountCents: number, currency: string = 'ARS') =>
    `${currency} ${(amountCents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cargar Stock a Barras</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Paso 1 de 3 — Seleccioná la barra a la que querés cargar stock.'}
            {step === 2 && 'Paso 2 de 3 — Seleccioná los items del inventario global.'}
            {step === 3 && 'Paso 3 de 3 — Configurá cantidad y tipo de uso para cada item.'}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step
                    ? 'bg-primary text-primary-foreground'
                    : s === step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-0.5 ${s < step ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {/* Step 1: Select bar */}
          {step === 1 && (
            <div className="space-y-3 py-2">
              {bars.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay barras creadas en este evento. Creá una barra primero.
                </div>
              ) : (
                bars.map((bar) => (
                  <div
                    key={bar.id}
                    onClick={() => setSelectedBarId(bar.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedBarId === bar.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          selectedBarId === bar.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {bar.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{bar.name}</p>
                        <Badge variant="outline" className="text-xs mt-0.5">
                          {bar.type}
                        </Badge>
                      </div>
                    </div>
                    {selectedBarId === bar.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 2: Select inventory items */}
          {step === 2 && (
            <div className="space-y-3 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, marca o proveedor..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedInventoryIds.size} seleccionado{selectedInventoryIds.size !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllVisible}>
                    Seleccionar todos
                  </Button>
                  {selectedInventoryIds.size > 0 && (
                    <Button variant="ghost" size="sm" onClick={deselectAll}>
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              {isLoadingInventory ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchFilter
                    ? 'No se encontraron items con ese filtro'
                    : 'No hay stock disponible en el inventario global'}
                </div>
              ) : (
                <div className="rounded-lg border max-h-[40vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Insumo</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead className="text-right">Disponible</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => toggleInventoryItem(item.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedInventoryIds.has(item.id)}
                              onCheckedChange={() => toggleInventoryItem(item.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {item.drink?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.drink?.brand} — {item.drink?.volume}ml
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.supplier?.name || 'Sin proveedor'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.availableQuantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Configure each item */}
          {step === 3 && (
            <div className="space-y-4 py-2">
              {Array.from(itemConfigs.entries()).map(([id, config]) => {
                const unitCostInPesos = config.unitCost / 100;
                const salePriceNum = parseFloat(config.salePrice);
                const profitMargin =
                  config.sellAsWholeUnit && salePriceNum > 0 && unitCostInPesos > 0
                    ? {
                        profit: salePriceNum - unitCostInPesos,
                        margin: ((salePriceNum - unitCostInPesos) / unitCostInPesos) * 100,
                        isPositive: salePriceNum > unitCostInPesos,
                      }
                    : null;

                return (
                  <div key={id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{config.drink.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.drink.brand} — {config.supplier} — Disponible: {config.availableQuantity}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatCurrency(config.unitCost, config.currency)} c/u
                      </Badge>
                    </div>

                    {/* Tipo de uso — radio cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig(id, 'sellAsWholeUnit', false);
                          updateConfig(id, 'salePrice', '');
                        }}
                        disabled={isAssigning}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                          !config.sellAsWholeUnit
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <Beaker className={`h-5 w-5 shrink-0 ${!config.sellAsWholeUnit ? 'text-blue-600' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-sm font-medium ${!config.sellAsWholeUnit ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                            Para recetas
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ingrediente para tragos
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig(id, 'sellAsWholeUnit', true)}
                        disabled={isAssigning}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                          config.sellAsWholeUnit
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30 ring-1 ring-green-500'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <Package className={`h-5 w-5 shrink-0 ${config.sellAsWholeUnit ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-sm font-medium ${config.sellAsWholeUnit ? 'text-green-700 dark:text-green-300' : ''}`}>
                            Venta directa
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Se vende como unidad
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className={`grid gap-3 ${config.sellAsWholeUnit ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Cantidad <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max={config.availableQuantity}
                          value={config.quantity}
                          onChange={(e) => updateConfig(id, 'quantity', e.target.value)}
                          placeholder={`Max: ${config.availableQuantity}`}
                          disabled={isAssigning}
                        />
                      </div>

                      {config.sellAsWholeUnit && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Precio venta ($) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={config.salePrice}
                            onChange={(e) => updateConfig(id, 'salePrice', e.target.value)}
                            placeholder="Ej: 5.00"
                            disabled={isAssigning}
                          />
                        </div>
                      )}
                    </div>

                    {/* Profit margin — only for direct sale */}
                    {config.sellAsWholeUnit && profitMargin && (
                      <div
                        className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                          profitMargin.isPositive
                            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                            : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`h-4 w-4 ${profitMargin.isPositive ? '' : 'rotate-180'}`} />
                          <span>Margen:</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{profitMargin.margin.toFixed(1)}%</span>
                          <span className="text-xs ml-1">
                            (${profitMargin.profit.toFixed(2)}/u)
                          </span>
                        </div>
                      </div>
                    )}

                    {config.sellAsWholeUnit && unitCostInPesos > 0 && !profitMargin && (
                      <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                        <span className="text-muted-foreground">Costo unitario:</span>
                        <span className="font-medium">${unitCostInPesos.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => goToStep(step - 1)}
                disabled={isAssigning}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              Cancelar
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => goToStep(step + 1)}
                disabled={
                  (step === 1 && !selectedBarId) ||
                  (step === 2 && selectedInventoryIds.size === 0)
                }
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleAssignAll}
                disabled={isAssigning || itemConfigs.size === 0}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Asignar {itemConfigs.size} item{itemConfigs.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
