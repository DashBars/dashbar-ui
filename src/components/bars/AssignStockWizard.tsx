import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useEventRecipes } from '@/hooks/useRecipes';
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
  ExternalLink,
  Info,
} from 'lucide-react';

interface AssignStockWizardProps {
  eventId: number;
  bars: Bar[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemConfig {
  globalInventoryId: number;
  drink: { id: number; name: string; brand: string; volume: number };
  supplier: string;
  availableQuantity: number;
  unitCost: number;
  currency: string;
  quantity: string;
  sellAsWholeUnit: boolean;
  salePrice: string;
}

interface SupplierSlot {
  name: string;
  configId: number;
  available: number;
  unitCost: number;
  currency: string;
}

interface ConfigGroup {
  key: string;
  drinkName: string;
  drinkBrand: string;
  drinkVolume: number;
  suppliers: SupplierSlot[];
  totalAvailable: number;
}

export function AssignStockWizard({
  eventId,
  bars,
  open,
  onOpenChange,
}: AssignStockWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: inventory = [], isLoading: isLoadingInventory } = useGlobalInventory();
  const { data: eventRecipes = [] } = useEventRecipes(eventId);

  const [step, setStep] = useState(1);
  const [selectedBarIds, setSelectedBarIds] = useState<Set<number>>(new Set());
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<Set<number>>(new Set());
  const [itemConfigs, setItemConfigs] = useState<Map<number, ItemConfig>>(new Map());
  const [searchFilter, setSearchFilter] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignProgress, setAssignProgress] = useState({
    completed: 0,
    total: 0,
    success: 0,
    errors: 0,
  });

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedBarIds(new Set());
      setSelectedInventoryIds(new Set());
      setItemConfigs(new Map());
      setSearchFilter('');
      setIsAssigning(false);
      setAssignProgress({ completed: 0, total: 0, success: 0, errors: 0 });
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

  const selectedBars = bars.filter((b) => selectedBarIds.has(b.id));

  const toggleBarSelection = useCallback((barId: number) => {
    setSelectedBarIds((prev) => {
      const next = new Set(prev);
      if (next.has(barId)) {
        next.delete(barId);
      } else {
        next.add(barId);
      }
      return next;
    });
  }, []);

  const toggleAllBars = useCallback(() => {
    setSelectedBarIds((prev) => {
      if (prev.size === bars.length) {
        return new Set();
      }
      return new Set(bars.map((b) => b.id));
    });
  }, [bars]);

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
            id: inv.drink?.id || 0,
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

  const goToStep = (newStep: number) => {
    if (newStep === 3 && step === 2) {
      initializeConfigs();
    }
    setStep(newStep);
  };

  const barCount = selectedBarIds.size || 1;

  // Group configs by drink identity (name+brand+volume) so same product
  // from different suppliers shows as a single card in Step 3
  const configGroups = useMemo((): ConfigGroup[] => {
    const groupMap = new Map<string, ConfigGroup>();

    for (const [id, config] of itemConfigs) {
      const key = `${config.drink.id}|${config.drink.name.toLowerCase()}|${config.drink.brand.toLowerCase()}|${config.drink.volume}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          drinkName: config.drink.name,
          drinkBrand: config.drink.brand,
          drinkVolume: config.drink.volume,
          suppliers: [],
          totalAvailable: 0,
        });
      }

      const group = groupMap.get(key)!;
      group.suppliers.push({
        name: config.supplier,
        configId: id,
        available: config.availableQuantity,
        unitCost: config.unitCost,
        currency: config.currency,
      });
      group.totalAvailable += config.availableQuantity;
    }

    return Array.from(groupMap.values());
  }, [itemConfigs]);

  // Get the total per-bar quantity for a group (sum of individual config quantities)
  const getGroupQuantity = useCallback(
    (group: ConfigGroup): number => {
      return group.suppliers.reduce((sum, s) => {
        return sum + (parseInt(itemConfigs.get(s.configId)?.quantity || '0', 10) || 0);
      }, 0);
    },
    [itemConfigs],
  );

  // Get the display string for the quantity input for a group
  const getGroupQuantityStr = useCallback(
    (group: ConfigGroup): string => {
      const total = getGroupQuantity(group);
      return total > 0 ? total.toString() : '';
    },
    [getGroupQuantity],
  );

  // Update quantity for a group, distributing greedily across supplier slots and clamping to max
  const updateGroupQuantity = useCallback(
    (group: ConfigGroup, rawValue: string) => {
      if (rawValue === '') {
        setItemConfigs((prev) => {
          const next = new Map(prev);
          for (const supplier of group.suppliers) {
            const config = next.get(supplier.configId);
            if (config) next.set(supplier.configId, { ...config, quantity: '' });
          }
          return next;
        });
        return;
      }

      let qty = parseInt(rawValue, 10);
      if (isNaN(qty) || qty < 0) qty = 0;

      const maxPerBar = Math.floor(group.totalAvailable / barCount);
      qty = Math.min(qty, maxPerBar);

      setItemConfigs((prev) => {
        const next = new Map(prev);
        let remaining = qty;

        for (const supplier of group.suppliers) {
          const config = next.get(supplier.configId);
          if (!config) continue;
          const maxFromThis = Math.floor(supplier.available / barCount);
          const take = Math.min(remaining, maxFromThis);
          next.set(supplier.configId, {
            ...config,
            quantity: take > 0 ? take.toString() : '0',
          });
          remaining -= take;
        }

        return next;
      });
    },
    [barCount],
  );

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

  // Update sell type for all items in a group
  const updateGroupType = useCallback(
    (group: ConfigGroup, sellAsWholeUnit: boolean) => {
      setItemConfigs((prev) => {
        const next = new Map(prev);

        // Determine auto-fill price when switching to direct sale
        let autoPrice = '';
        const groupDrinkId = itemConfigs.get(group.suppliers[0].configId)?.drink.id;
        if (sellAsWholeUnit) {
          const existingPrice = groupDrinkId
            ? getExistingDirectSalePrice(groupDrinkId)
            : null;
          if (existingPrice) {
            autoPrice = (existingPrice / 100).toString();
          } else {
            // Check batch price from other groups
            for (const [, config] of next) {
              if (
                config.sellAsWholeUnit &&
                config.drink.name.toLowerCase() === group.drinkName.toLowerCase() &&
                config.salePrice &&
                parseFloat(config.salePrice) > 0
              ) {
                autoPrice = config.salePrice;
                break;
              }
            }
          }
        }

        for (const supplier of group.suppliers) {
          const config = next.get(supplier.configId);
          if (config) {
            next.set(supplier.configId, {
              ...config,
              sellAsWholeUnit,
              salePrice: sellAsWholeUnit ? autoPrice : '',
            });
          }
        }

        return next;
      });
    },
    [getExistingDirectSalePrice, itemConfigs],
  );

  // Update price for all items in a group + sync to other groups with same drink name
  const updateGroupPrice = useCallback(
    (group: ConfigGroup, salePrice: string) => {
      setItemConfigs((prev) => {
        const next = new Map(prev);
        const groupConfigIds = new Set(group.suppliers.map((s) => s.configId));

        // Update all configs in this group
        for (const supplier of group.suppliers) {
          const config = next.get(supplier.configId);
          if (config) {
            next.set(supplier.configId, { ...config, salePrice });
          }
        }

        // Sync to other direct-sale items with same drink name (cross-group)
        for (const [id, config] of next) {
          if (
            !groupConfigIds.has(id) &&
            config.sellAsWholeUnit &&
            config.drink.name.toLowerCase() === group.drinkName.toLowerCase()
          ) {
            next.set(id, { ...config, salePrice });
          }
        }

        return next;
      });
    },
    [],
  );

  // Validate step 3 before submitting — validates per group
  const validateConfigs = (): boolean => {
    for (const group of configGroups) {
      const groupQty = getGroupQuantity(group);
      if (groupQty <= 0) {
        toast.error(`Ingresá la cantidad para ${group.drinkName}`);
        return false;
      }
      const totalNeeded = groupQty * barCount;
      if (totalNeeded > group.totalAvailable) {
        toast.error(
          `${group.drinkName}: necesitás ${totalNeeded} unidades (${groupQty} × ${barCount} barras) pero solo hay ${group.totalAvailable} disponibles.`,
        );
        return false;
      }
      const firstConfig = itemConfigs.get(group.suppliers[0].configId);
      if (firstConfig?.sellAsWholeUnit) {
        const price = parseFloat(firstConfig.salePrice);
        if (!price || price <= 0) {
          toast.error(`Ingresá el precio de venta para ${group.drinkName}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleAssignAll = async () => {
    if (selectedBarIds.size === 0 || !validateConfigs()) return;

    const tasks: Array<{ dto: AssignStockDto; barId: number; drinkName: string }> = [];
    for (const barId of selectedBarIds) {
      for (const [, config] of itemConfigs) {
        const qty = parseInt(config.quantity, 10);
        if (!qty || qty <= 0) continue;

        tasks.push({
          barId,
          drinkName: config.drink.name,
          dto: {
            globalInventoryId: config.globalInventoryId,
            eventId,
            barId,
            quantity: qty,
            sellAsWholeUnit: config.sellAsWholeUnit,
            salePrice: config.sellAsWholeUnit
              ? Math.round(parseFloat(config.salePrice) * 100)
              : undefined,
          },
        });
      }
    }

    if (tasks.length === 0) {
      toast.error('No hay asignaciones para procesar');
      return;
    }

    setIsAssigning(true);
    setAssignProgress({ completed: 0, total: tasks.length, success: 0, errors: 0 });

    let successCount = 0;
    let errorCount = 0;
    const CHUNK_SIZE = 10;
    const sampleErrors: string[] = [];

    for (let i = 0; i < tasks.length; i += CHUNK_SIZE) {
      const chunk = tasks.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map((task) => stockMovementsApi.assign(task.dto)),
      );

      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          successCount++;
          return;
        }
        errorCount++;
        if (sampleErrors.length < 3) {
          const task = chunk[idx];
          const barName =
            bars.find((b) => b.id === task.barId)?.name || `Barra #${task.barId}`;
          const reason =
            (res.reason as any)?.response?.data?.message ||
            (res.reason as any)?.message ||
            'Error desconocido';
          sampleErrors.push(`${task.drinkName} -> ${barName}: ${reason}`);
        }
      });

      setAssignProgress({
        completed: Math.min(i + chunk.length, tasks.length),
        total: tasks.length,
        success: successCount,
        errors: errorCount,
      });
    }

    setIsAssigning(false);

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['bars'] });
      queryClient.invalidateQueries({ queryKey: ['global-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      const numBars = selectedBarIds.size;
      const groupCount = configGroups.length;
      toast.success(
        numBars === 1
          ? `${groupCount} producto${groupCount > 1 ? 's' : ''} asignado${groupCount > 1 ? 's' : ''} a ${selectedBars[0]?.name}`
          : `${groupCount} producto${groupCount > 1 ? 's' : ''} asignado${groupCount > 1 ? 's' : ''} a ${numBars} barras`,
      );
    }

    if (errorCount > 0) {
      toast.warning(
        `${errorCount} asignaciones con error.${sampleErrors.length ? ` Ejemplos: ${sampleErrors.join(' | ')}` : ''}`,
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
            {step === 1 && 'Paso 1 de 3 — Seleccioná las barras a las que querés cargar stock.'}
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
          {/* Step 1: Select bars */}
          {step === 1 && (
            <div className="space-y-3 py-2">
              {bars.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay barras creadas en este evento. Creá una barra primero.
                </div>
              ) : (
                <>
                  {/* Select all toggle */}
                  <div
                    className="flex items-center gap-3 px-4 py-2 rounded-lg border border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={toggleAllBars}
                  >
                    <Checkbox
                      checked={selectedBarIds.size === bars.length}
                      onCheckedChange={() => toggleAllBars()}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-medium">
                      Seleccionar todas ({bars.length})
                    </span>
                    {selectedBarIds.size > 0 && selectedBarIds.size < bars.length && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {selectedBarIds.size} seleccionada{selectedBarIds.size !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {bars.map((bar) => {
                    const isSelected = selectedBarIds.has(bar.id);
                    return (
                      <div
                        key={bar.id}
                        onClick={() => toggleBarSelection(bar.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              isSelected
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
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleBarSelection(bar.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })}
                </>
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
                <div className="text-center py-8">
                  {searchFilter ? (
                    <p className="text-muted-foreground">No se encontraron items con ese filtro</p>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        No hay stock disponible en el inventario global
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Para asignar stock a las barras, primero necesitás registrar compras de insumos en el inventario global.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          navigate('/suppliers?tab=global-stock');
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ir al inventario global
                      </Button>
                    </div>
                  )}
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
                          <TableCell onClick={(e) => e.stopPropagation()}>
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

          {/* Step 3: Configure each item (grouped by product) */}
          {step === 3 && (
            <div className="space-y-4 py-2">
              {/* Multi-bar distribution info */}
              {barCount > 1 && (
                <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium">
                      Asignando a {barCount} barras: {selectedBars.map((b) => b.name).join(', ')}
                    </p>
                    <p className="text-xs mt-0.5 opacity-80">
                      La cantidad que ingreses para cada producto se asignará a <strong>cada barra</strong>.
                      El total requerido será cantidad × {barCount} barras.
                    </p>
                  </div>
                </div>
              )}

              {configGroups.map((group) => {
                const firstConfig = itemConfigs.get(group.suppliers[0].configId)!;
                const groupQty = getGroupQuantity(group);
                const groupQtyStr = getGroupQuantityStr(group);
                const maxPerBar = Math.floor(group.totalAvailable / barCount);
                const isMultiSupplier = group.suppliers.length > 1;

                // Weighted average unit cost
                const weightedUnitCost =
                  group.totalAvailable > 0
                    ? group.suppliers.reduce((sum, s) => sum + s.unitCost * s.available, 0) / group.totalAvailable
                    : group.suppliers[0].unitCost;
                const unitCostInPesos = weightedUnitCost / 100;

                const sellAsWholeUnit = firstConfig.sellAsWholeUnit;
                const salePrice = firstConfig.salePrice;
                const salePriceNum = parseFloat(salePrice);
                const existingPriceCents =
                  sellAsWholeUnit && firstConfig?.drink.id
                    ? getExistingDirectSalePrice(firstConfig.drink.id)
                    : null;
                const hasExistingPrice = existingPriceCents !== null;
                const isPriceLocked = hasExistingPrice;

                const profitMargin =
                  sellAsWholeUnit && salePriceNum > 0 && unitCostInPesos > 0
                    ? {
                        profit: salePriceNum - unitCostInPesos,
                        margin: ((salePriceNum - unitCostInPesos) / unitCostInPesos) * 100,
                        isPositive: salePriceNum > unitCostInPesos,
                      }
                    : null;

                return (
                  <div key={group.key} className="rounded-xl border p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{group.drinkName}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.drinkBrand} — {group.drinkVolume}ml — Disponible: {group.totalAvailable}
                          {barCount > 1 && ` (máx ${maxPerBar} por barra)`}
                        </p>
                        {isMultiSupplier ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Proveedores: {group.suppliers.map((s) => `${s.name} (${s.available})`).join(', ')}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Proveedor: {group.suppliers[0].name}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {isMultiSupplier ? 'Prom. ' : ''}
                        {formatCurrency(Math.round(weightedUnitCost), group.suppliers[0].currency)} c/u
                      </Badge>
                    </div>

                    {/* Multi-supplier note */}
                    {isMultiSupplier && (
                      <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-muted-foreground border border-slate-200 dark:border-slate-800">
                        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                          Mismo producto de {group.suppliers.length} proveedores distintos.
                          La cantidad se distribuye automáticamente entre lotes.
                        </span>
                      </div>
                    )}

                    {/* Tipo de uso — radio cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateGroupType(group, false)}
                        disabled={isAssigning}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                          !sellAsWholeUnit
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <Beaker className={`h-5 w-5 shrink-0 ${!sellAsWholeUnit ? 'text-blue-600' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-sm font-medium ${!sellAsWholeUnit ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                            Para recetas
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ingrediente para tragos
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateGroupType(group, true)}
                        disabled={isAssigning}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                          sellAsWholeUnit
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30 ring-1 ring-green-500'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <Package className={`h-5 w-5 shrink-0 ${sellAsWholeUnit ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-sm font-medium ${sellAsWholeUnit ? 'text-green-700 dark:text-green-300' : ''}`}>
                            Venta directa
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Se vende como unidad
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Quantity + Price */}
                    <div className={`grid gap-3 ${sellAsWholeUnit ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Cantidad por barra <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max={maxPerBar}
                          value={groupQtyStr}
                          onChange={(e) => updateGroupQuantity(group, e.target.value)}
                          placeholder={`Máx: ${maxPerBar}`}
                          disabled={isAssigning}
                        />
                        {barCount > 1 && groupQty > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            Total: {groupQty * barCount} de {group.totalAvailable} disponibles ({groupQty} × {barCount} barras)
                          </p>
                        )}
                      </div>

                      {sellAsWholeUnit && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Precio venta ($) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={salePrice}
                            onChange={(e) => {
                              if (!isPriceLocked) {
                                updateGroupPrice(group, e.target.value);
                              }
                            }}
                            placeholder="Ej: 5.00"
                            disabled={isAssigning || isPriceLocked}
                            className={isPriceLocked ? 'bg-muted cursor-not-allowed' : ''}
                          />
                        </div>
                      )}
                    </div>

                    {/* Existing price info banner */}
                    {sellAsWholeUnit && hasExistingPrice && (
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

                    {/* Profit margin — only for direct sale */}
                    {sellAsWholeUnit && profitMargin && (
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

                    {sellAsWholeUnit && unitCostInPesos > 0 && !profitMargin && (
                      <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                        <span className="text-muted-foreground">Costo unitario{isMultiSupplier ? ' (promedio)' : ''}:</span>
                        <span className="font-medium">${unitCostInPesos.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Loading banner during multi-bar assignment */}
        {isAssigning && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 mx-1">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium">Asignando stock...</p>
              <p className="text-xs mt-0.5 opacity-80">
                {barCount > 1
                  ? `Distribuyendo ${configGroups.length} producto${configGroups.length !== 1 ? 's' : ''} a ${barCount} barras. Esto puede tomar unos segundos.`
                  : `Asignando ${configGroups.length} producto${configGroups.length !== 1 ? 's' : ''}...`}
              </p>
              {assignProgress.total > 0 && (
                <p className="text-xs mt-1">
                  {assignProgress.completed}/{assignProgress.total} procesadas · ok {assignProgress.success} · errores {assignProgress.errors}
                </p>
              )}
              {assignProgress.total > 0 && (
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (assignProgress.completed / assignProgress.total) * 100,
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

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
                  (step === 1 && selectedBarIds.size === 0) ||
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
                disabled={isAssigning || configGroups.length === 0}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Asignando {assignProgress.completed}/{assignProgress.total}...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Asignar {configGroups.length} producto{configGroups.length !== 1 ? 's' : ''}
                    {barCount > 1 && ` a ${barCount} barras`}
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
