import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Undo2,
  Warehouse,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  Ban,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useBars } from '@/hooks/useBars';
import { useQueries } from '@tanstack/react-query';
import { stockApi, stockMovementsApi, inventoryMovementsApi } from '@/lib/api/dashbar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockKeys } from '@/hooks/useStock';
import type { Stock, BulkReturnStockDto, BulkReturnResult, BulkReturnMode, BulkDiscardStockDto, BulkDiscardResult, InventoryMovement } from '@/lib/api/types';
import { toast } from 'sonner';

interface BarPostEventOverviewProps {
  eventId: number;
  barId?: number; // Optional: if provided, show only this bar's stock
}

interface ConsumptionEntry {
  drinkId: number;
  drinkName: string;
  drinkBrand: string;
  drinkVolume: number;
  supplierId: number;
  supplierName: string;
  sellAsWholeUnit: boolean;
  totalConsumedMl: number;
}

interface StockWithBar extends Stock {
  barName?: string;
}

function stockKey(item: Stock): string {
  return `${item.barId}-${item.drinkId}-${item.supplierId}-${item.sellAsWholeUnit}`;
}

function formatCurrency(amount: number, currency: string = 'ARS') {
  return `${currency} ${(amount / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ──────────────── Descarte Section Component ──────────────── */
interface DescarteSectionProps {
  partialStock: StockWithBar[];
  eventId: number;
  bulkDiscardMutation: ReturnType<typeof useMutation<BulkDiscardResult, any, BulkDiscardStockDto>>;
  discardResult: BulkDiscardResult | null;
  setDiscardResult: (r: BulkDiscardResult | null) => void;
  discardConfirmOpen: boolean;
  setDiscardConfirmOpen: (open: boolean) => void;
  showBarColumn: boolean;
}

function DescarteSection({
  partialStock,
  eventId,
  bulkDiscardMutation,
  discardResult,
  setDiscardResult,
  discardConfirmOpen,
  setDiscardConfirmOpen,
  showBarColumn,
}: DescarteSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const executeDiscard = () => {
    const dto: BulkDiscardStockDto = {
      items: partialStock.map((s) => ({
        eventId,
        barId: s.barId,
        drinkId: s.drinkId,
        supplierId: s.supplierId,
        sellAsWholeUnit: s.sellAsWholeUnit,
      })),
      notes: 'Descarte de remanentes parciales post-evento',
    };
    bulkDiscardMutation.mutate(dto);
  };

  return (
    <>
      <Card className="rounded-2xl border-amber-200 dark:border-amber-800">
        <CardContent className="p-0">
          {/* Collapsible header */}
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors rounded-t-2xl"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-2">
                <Trash2 className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Remanentes parciales (descarte)</p>
                <p className="text-xs text-muted-foreground">
                  Stock con menos de una unidad completa - no se puede devolver
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {partialStock.length}
              </Badge>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {expanded && (
            <div className="border-t">
              <div className="max-h-[30vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      {showBarColumn && <TableHead>Barra</TableHead>}
                      <TableHead>Insumo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Remanente</TableHead>
                      <TableHead>% de unidad</TableHead>
                      <TableHead>Uso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partialStock.map((item) => {
                      const key = stockKey(item);
                      const drinkVol = item.drink?.volume || 1;
                      const pct = Math.round((item.quantity / drinkVol) * 100);
                      return (
                        <TableRow key={key} className="bg-amber-50/30 dark:bg-amber-950/10">
                          {showBarColumn && (
                            <TableCell className="text-sm font-medium">
                              {item.barName || 'Barra desconocida'}
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {item.drink?.name || 'Insumo desconocido'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.drink?.brand || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.supplier?.name || 'Proveedor desconocido'}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.quantity} ml</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              / {drinkVol} ml
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700"
                            >
                              {pct}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.sellAsWholeUnit ? 'Venta directa' : 'Recetas'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between border-t px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Estos remanentes se registrarán como descarte en los movimientos de stock
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950"
                  onClick={() => {
                    setDiscardResult(null);
                    setDiscardConfirmOpen(true);
                  }}
                  disabled={bulkDiscardMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Dar de baja ({partialStock.length})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discard confirmation dialog */}
      <Dialog
        open={discardConfirmOpen}
        onOpenChange={(open) => {
          if (!bulkDiscardMutation.isPending) {
            setDiscardConfirmOpen(open);
            if (!open) setDiscardResult(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {discardResult ? 'Resultado del descarte' : 'Confirmar descarte'}
            </DialogTitle>
            <DialogDescription>
              {discardResult
                ? 'Resumen del procesamiento de descarte'
                : `Se darán de baja ${partialStock.length} remanentes parciales.`}
            </DialogDescription>
          </DialogHeader>

          {discardResult ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{discardResult.processed} remanentes dados de baja</span>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                Total descartado: {discardResult.totalMlDiscarded} ml
              </p>
              {discardResult.errors.length > 0 && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 mt-2">
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{discardResult.errors.length} errores</span>
                  </div>
                  <ul className="text-xs text-destructive space-y-0.5 pl-6">
                    {discardResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <DialogFooter className="pt-2">
                <Button onClick={() => { setDiscardConfirmOpen(false); setDiscardResult(null); }}>
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 space-y-2">
                  {partialStock.map((item) => {
                    const drinkVol = item.drink?.volume || 1;
                    const pct = Math.round((item.quantity / drinkVol) * 100);
                    return (
                      <div key={stockKey(item)} className="flex items-center justify-between text-sm">
                        <span>
                          {item.drink?.name || 'Insumo'}
                          {item.drink?.brand && <span className="text-muted-foreground ml-1">({item.drink.brand})</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.quantity} ml ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Esta acción eliminará estos remanentes del sistema y los registrará como descarte
                    en los movimientos de stock. No se puede deshacer.
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDiscardConfirmOpen(false)}
                  disabled={bulkDiscardMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={executeDiscard}
                  disabled={bulkDiscardMutation.isPending}
                >
                  {bulkDiscardMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Dar de baja'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BarPostEventOverview({ eventId, barId }: BarPostEventOverviewProps) {
  const { data: bars = [], isLoading: isLoadingBars } = useBars(eventId);
  const queryClient = useQueryClient();

  // Determine which bars to fetch stock for
  const targetBars = useMemo(() => {
    if (barId) return bars.filter((b) => b.id === barId);
    return bars;
  }, [bars, barId]);

  // Fetch stock for all target bars in parallel
  const stockQueries = useQueries({
    queries: targetBars.map((bar) => ({
      queryKey: stockKeys.list(eventId, bar.id),
      queryFn: () => stockApi.getStock(eventId, bar.id),
      enabled: !!eventId && !!bar.id,
    })),
  });

  // Fetch inventory movements for all target bars (for consumption data)
  const movementQueries = useQueries({
    queries: targetBars.map((bar) => ({
      queryKey: ['inventory-movements', eventId, bar.id],
      queryFn: () => inventoryMovementsApi.findAll(eventId, bar.id),
      enabled: !!eventId && !!bar.id,
    })),
  });

  const isLoadingStock = stockQueries.some((q) => q.isLoading);
  const isLoadingMovements = movementQueries.some((q) => q.isLoading);
  const isLoading = isLoadingBars || isLoadingStock;

  // Merge all stock with bar names
  const allStock: StockWithBar[] = useMemo(() => {
    const items: StockWithBar[] = [];
    stockQueries.forEach((query, idx) => {
      const bar = targetBars[idx];
      if (query.data) {
        query.data.forEach((s: Stock) => {
          items.push({ ...s, barName: bar?.name });
        });
      }
    });
    return items;
  }, [stockQueries, targetBars]);

  // Split into returnable (>= 1 full unit), partial remainders (< 1 full unit), and consumed (0)
  const { returnableStock, partialStock, consumedStock } = useMemo(() => {
    const returnable: StockWithBar[] = [];
    const partial: StockWithBar[] = [];
    const consumed: StockWithBar[] = [];
    for (const s of allStock) {
      if (s.quantity <= 0) {
        consumed.push(s);
      } else {
        const drinkVol = s.drink?.volume || 0;
        if (drinkVol > 0 && s.quantity < drinkVol) {
          partial.push(s);
        } else {
          returnable.push(s);
        }
      }
    }
    return { returnableStock: returnable, partialStock: partial, consumedStock: consumed };
  }, [allStock]);

  // Compute consumption data from inventory movements (sale decrements)
  const consumptionData: ConsumptionEntry[] = useMemo(() => {
    if (isLoadingMovements) return [];
    const map = new Map<string, ConsumptionEntry>();

    // Build drink/supplier info from stock data
    const drinkInfo = new Map<number, { name: string; brand: string; volume: number }>();
    const supplierInfo = new Map<number, string>();
    for (const s of allStock) {
      if (s.drink) drinkInfo.set(s.drinkId, { name: s.drink.name, brand: s.drink.brand || '', volume: s.drink.volume || 0 });
      if (s.supplier) supplierInfo.set(s.supplierId, s.supplier.name);
    }

    for (const query of movementQueries) {
      if (!query.data) continue;
      for (const m of query.data as InventoryMovement[]) {
        // Only count sale decrements (negative quantity movements from sales)
        if (m.quantity >= 0) continue;
        if (m.reason !== 'SALE_DECREMENT') continue;

        const key = `${m.drinkId}-${m.supplierId}-${m.sellAsWholeUnit ?? false}`;
        const existing = map.get(key);
        if (existing) {
          existing.totalConsumedMl += Math.abs(m.quantity);
        } else {
          const drink = drinkInfo.get(m.drinkId);
          map.set(key, {
            drinkId: m.drinkId,
            drinkName: drink?.name || 'Insumo',
            drinkBrand: drink?.brand || '',
            drinkVolume: drink?.volume || 0,
            supplierId: m.supplierId,
            supplierName: supplierInfo.get(m.supplierId) || 'Proveedor',
            sellAsWholeUnit: m.sellAsWholeUnit ?? false,
            totalConsumedMl: Math.abs(m.quantity),
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalConsumedMl - a.totalConsumedMl);
  }, [movementQueries, allStock, isLoadingMovements]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkReturnMode | null>(null);
  const [result, setResult] = useState<BulkReturnResult | null>(null);
  const [tableConsumptionExpanded, setTableConsumptionExpanded] = useState(true);
  const [isBulkReturning, setIsBulkReturning] = useState(false);
  const [bulkReturnProgress, setBulkReturnProgress] = useState({
    processed: 0,
    total: 0,
    chunk: 0,
    totalChunks: 0,
  });

  const [discardResult, setDiscardResult] = useState<BulkDiscardResult | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [consumptionExpanded, setConsumptionExpanded] = useState(true);

  const bulkDiscardMutation = useMutation({
    mutationFn: (dto: BulkDiscardStockDto) => stockMovementsApi.bulkDiscard(dto),
    onSuccess: (data) => {
      setDiscardResult(data);
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      if (data.errors.length === 0) {
        toast.success(`${data.processed} remanentes dados de baja`);
      } else {
        toast.warning(`${data.processed} procesados, ${data.errors.length} errores`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al dar de baja remanentes');
    },
  });

  // Derived data -- only from returnable stock
  const returnablePurchased = useMemo(
    () => returnableStock.filter((s) => s.ownershipMode === 'purchased'),
    [returnableStock],
  );
  const returnableConsignment = useMemo(
    () => returnableStock.filter((s) => s.ownershipMode === 'consignment'),
    [returnableStock],
  );

  const selectedItems = useMemo(
    () => returnableStock.filter((s) => selected.has(stockKey(s))),
    [returnableStock, selected],
  );
  const selectedPurchased = useMemo(
    () => selectedItems.filter((s) => s.ownershipMode === 'purchased'),
    [selectedItems],
  );
  const selectedConsignment = useMemo(
    () => selectedItems.filter((s) => s.ownershipMode === 'consignment'),
    [selectedItems],
  );

  // Handlers -- only operate on returnable items
  const toggleItem = (key: string) => {
    // Only allow toggling returnable items
    const isReturnable = returnableStock.some((s) => stockKey(s) === key);
    if (!isReturnable) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === returnableStock.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(returnableStock.map(stockKey)));
    }
  };

  const openConfirm = (mode: BulkReturnMode) => {
    setPendingAction(mode);
    setResult(null);
    setConfirmOpen(true);
  };

  const executeAction = async () => {
    if (!pendingAction) return;

    // Always filter to only items with stock remaining
    const itemsToProcess = (pendingAction === 'auto' ? returnableStock : selectedItems)
      .filter((s) => s.quantity > 0);

    if (itemsToProcess.length === 0) {
      toast.error('No hay items con stock para procesar');
      return;
    }

    const items = itemsToProcess.map((s) => {
      // Convert ml -> units (bottles) since backend expects units.
      const drinkVolume = s.drink?.volume || 0;
      const unitQuantity = drinkVolume > 0 ? Math.floor(s.quantity / drinkVolume) : s.quantity;
      return {
        eventId,
        barId: s.barId,
        drinkId: s.drinkId,
        supplierId: s.supplierId,
        sellAsWholeUnit: s.sellAsWholeUnit,
        quantity: unitQuantity,
      };
    });

    const CHUNK_SIZE = 3;
    const totalChunks = Math.ceil(items.length / CHUNK_SIZE);
    const aggregate: BulkReturnResult = {
      processed: 0,
      toGlobal: 0,
      toSupplier: 0,
      errors: [],
    };

    setIsBulkReturning(true);
    setBulkReturnProgress({
      processed: 0,
      total: items.length,
      chunk: 0,
      totalChunks,
    });

    try {
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunkItems = items.slice(i, i + CHUNK_SIZE);
        const currentChunk = Math.floor(i / CHUNK_SIZE) + 1;

        setBulkReturnProgress((prev) => ({
          ...prev,
          chunk: currentChunk,
          totalChunks,
        }));

        const dto: BulkReturnStockDto = {
          mode: pendingAction,
          items: chunkItems,
          notes:
            pendingAction === 'auto'
              ? 'Procesamiento automático post-evento'
              : undefined,
        };

        const data = await stockMovementsApi.bulkReturn(dto);
        aggregate.processed += data.processed;
        aggregate.toGlobal += data.toGlobal;
        aggregate.toSupplier += data.toSupplier;
        aggregate.errors.push(...data.errors);

        setBulkReturnProgress({
          processed: Math.min(i + chunkItems.length, items.length),
          total: items.length,
          chunk: currentChunk,
          totalChunks,
        });
      }

      setBulkReturnProgress((prev) => ({
        ...prev,
        processed: prev.total,
      }));

      setResult(aggregate);
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['global-inventory'] });
      setSelected(new Set());

      if (aggregate.errors.length === 0) {
        toast.success(`${aggregate.processed} items procesados correctamente`);
      } else {
        toast.warning(
          `${aggregate.processed} procesados, ${aggregate.errors.length} errores`,
        );
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Error al procesar devoluciones',
      );
    } finally {
      setIsBulkReturning(false);
    }
  };

  const actionLabels: Record<BulkReturnMode, string> = {
    to_global: 'Devolver al almacén general',
    to_supplier: 'Devolver al proveedor',
    auto: 'Procesar automáticamente',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // All stock rows are gone (fully returned + deleted from DB)
  if (allStock.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-lg font-medium">Todo el stock fue procesado</p>
          <p className="text-sm text-muted-foreground mt-1">
            No queda stock remanente en las barras de este evento
          </p>
        </CardContent>
      </Card>
    );
  }

  // No returnable items left, but consumed/partial items still exist in DB
  if (returnableStock.length === 0 && (consumedStock.length > 0 || partialStock.length > 0)) {
    return (
      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">Todo el stock fue devuelto o consumido</p>
              <p className="text-xs text-muted-foreground">No queda stock pendiente de devolución</p>
            </div>
          </CardContent>
        </Card>

        {/* Partial remainders that need to be discarded */}
        {partialStock.length > 0 && (
          <DescarteSection
            partialStock={partialStock}
            eventId={eventId}
            bulkDiscardMutation={bulkDiscardMutation}
            discardResult={discardResult}
            setDiscardResult={setDiscardResult}
            discardConfirmOpen={discardConfirmOpen}
            setDiscardConfirmOpen={setDiscardConfirmOpen}
            showBarColumn={targetBars.length > 1}
          />
        )}

        {/* Show consumed items from inventory movements */}
        {consumptionData.length > 0 && (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => setConsumptionExpanded((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-purple-500/10 p-1.5">
                    <Zap className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium">
                    {consumptionData.length} {consumptionData.length === 1 ? 'insumo consumido' : 'insumos consumidos'} durante el evento
                  </p>
                </div>
                {consumptionExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {consumptionExpanded && (
                <div className="space-y-1.5 mt-3">
                  {consumptionData.map((item) => {
                    const units = item.drinkVolume > 0 ? (item.totalConsumedMl / item.drinkVolume) : 0;
                    const displayUnits = units % 1 === 0 ? units.toString() : units.toFixed(1);
                    return (
                      <div
                        key={`${item.drinkId}-${item.supplierId}-${item.sellAsWholeUnit}`}
                        className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.drinkName}</span>
                          {item.drinkBrand && (
                            <span className="text-xs text-muted-foreground">({item.drinkBrand})</span>
                          )}
                          <span className="text-xs text-muted-foreground">- {item.supplierName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.drinkVolume > 0
                              ? `${displayUnits} ${units === 1 ? 'unidad' : 'unidades'} (${item.totalConsumedMl.toLocaleString('es-AR')} ml)`
                              : `${item.totalConsumedMl.toLocaleString('es-AR')} ml`}
                          </span>
                          <Badge variant="outline" className={`text-[10px] ${item.sellAsWholeUnit ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'}`}>
                            {item.sellAsWholeUnit ? 'Venta directa' : 'Recetas'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {isLoadingMovements && consumptionData.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <Skeleton className="h-6 w-48" />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const showBarColumn = targetBars.length > 1;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-200">Stock remanente post-evento</p>
          <p className="text-blue-700 dark:text-blue-300 mt-0.5">
            Este stock quedó en las barras al finalizar el evento. Podés devolver items al almacén general,
            al proveedor (consignación) o procesar todo automáticamente.
          </p>
        </div>
      </div>

      {/* Summary cards -- only count returnable items */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Para devolver</p>
                <p className="text-xl font-semibold">{returnableStock.length}</p>
                {(consumptionData.length > 0 || partialStock.length > 0) && (
                  <p className="text-xs text-muted-foreground">
                    {partialStock.length > 0 && `${partialStock.length} remanentes`}
                    {partialStock.length > 0 && consumptionData.length > 0 && ' + '}
                    {consumptionData.length > 0 && `${consumptionData.length} consumidos`}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-500/10 p-2.5">
                <Warehouse className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Comprado</p>
                <p className="text-xl font-semibold">{returnablePurchased.length} items</p>
                <p className="text-xs text-muted-foreground">&rarr; Almacén general</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-500/10 p-2.5">
                <Undo2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Consignación</p>
                <p className="text-xl font-semibold">{returnableConsignment.length} items</p>
                <p className="text-xs text-muted-foreground">&rarr; Devolver a proveedor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3">
        <Button
          variant="default"
          size="sm"
          className="gap-1.5"
          onClick={() => openConfirm('auto')}
          disabled={returnableStock.length === 0 || isBulkReturning}
        >
          <Zap className="h-4 w-4" />
          Procesar todo automáticamente
        </Button>

        <div className="h-5 w-px bg-border mx-1" />

        <span className="text-xs text-muted-foreground mr-1">
          {selected.size > 0
            ? `${selected.size} seleccionados:`
            : 'Seleccioná items para acciones manuales'}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => openConfirm('to_global')}
          disabled={selected.size === 0 || selectedPurchased.length === 0 || isBulkReturning}
        >
          <Warehouse className="h-3.5 w-3.5" />
          Devolver al almacén
          {selectedPurchased.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">{selectedPurchased.length}</Badge>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => openConfirm('to_supplier')}
          disabled={selected.size === 0 || selectedConsignment.length === 0 || isBulkReturning}
        >
          <Undo2 className="h-3.5 w-3.5" />
          Devolver al proveedor
          {selectedConsignment.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">{selectedConsignment.length}</Badge>
          )}
        </Button>
      </div>

      {/* Stock table */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <div className="max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selected.size === returnableStock.length && returnableStock.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  {showBarColumn && <TableHead>Barra</TableHead>}
                  <TableHead>Insumo</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo unit.</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Returnable items first */}
                {returnableStock.map((item) => {
                  const key = stockKey(item);
                  const isSelected = selected.has(key);
                  return (
                    <TableRow
                      key={key}
                      className={isSelected ? 'bg-muted/50' : undefined}
                      onClick={() => toggleItem(key)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItem(key)}
                        />
                      </TableCell>
                      {showBarColumn && (
                        <TableCell className="text-sm font-medium">
                          {(item as StockWithBar).barName || 'Barra desconocida'}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <div>
                          {item.drink?.name || 'Insumo desconocido'}
                          {item.drink?.brand && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({item.drink.brand})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.supplier?.name || 'Proveedor desconocido'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {item.drink?.volume && item.drink.volume > 0
                            ? Math.floor(item.quantity / item.drink.volume)
                            : item.quantity}
                        </span>
                        {item.drink?.volume && item.drink.volume > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({item.drink.volume} ml c/u)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(item.unitCost, item.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.ownershipMode === 'consignment'
                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                              : 'bg-green-100 text-green-800 border-green-200'
                          }
                        >
                          {item.ownershipMode === 'consignment' ? 'Consignación' : 'Comprado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.sellAsWholeUnit ? 'Venta directa' : 'Recetas'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Separator between returnable and consumed */}
                {consumptionData.length > 0 && returnableStock.length > 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={showBarColumn ? 8 : 7}
                      className="py-2 px-4"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 text-xs text-muted-foreground"
                        onClick={() =>
                          setTableConsumptionExpanded((v) => !v)
                        }
                      >
                        <div className="h-px flex-1 bg-border" />
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-purple-500" />
                          Consumidos durante el evento ({consumptionData.length})
                          {tableConsumptionExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 ml-1" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 ml-1" />
                          )}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </button>
                    </TableCell>
                  </TableRow>
                )}

                {/* Consumed items from inventory movements */}
                {tableConsumptionExpanded && consumptionData.map((item) => {
                  const key = `consumed-${item.drinkId}-${item.supplierId}-${item.sellAsWholeUnit}`;
                  const units = item.drinkVolume > 0 ? (item.totalConsumedMl / item.drinkVolume) : 0;
                  const displayUnits = units % 1 === 0 ? units.toString() : units.toFixed(1);
                  return (
                    <TableRow
                      key={key}
                      className="bg-muted/20 hover:bg-muted/30 cursor-default"
                    >
                      <TableCell>
                        <div className="h-4 w-4 flex items-center justify-center">
                          <Zap className="h-3.5 w-3.5 text-purple-400" />
                        </div>
                      </TableCell>
                      {showBarColumn && (
                        <TableCell className="text-sm text-muted-foreground">
                          Todas
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="text-muted-foreground">
                          {item.drinkName}
                          {item.drinkBrand && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({item.drinkBrand})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.supplierName}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {displayUnits} {units === 1 ? 'unidad' : 'unidades'}
                        </span>
                        <span className="text-xs text-muted-foreground/60 ml-1">
                          ({item.totalConsumedMl.toLocaleString('es-AR')} ml)
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        —
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                          Consumido
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${item.sellAsWholeUnit ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {item.sellAsWholeUnit ? 'Venta directa' : 'Recetas'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Partial remainders (descarte) section */}
      {partialStock.length > 0 && (
        <DescarteSection
          partialStock={partialStock}
          eventId={eventId}
          bulkDiscardMutation={bulkDiscardMutation}
          discardResult={discardResult}
          setDiscardResult={setDiscardResult}
          discardConfirmOpen={discardConfirmOpen}
          setDiscardConfirmOpen={setDiscardConfirmOpen}
          showBarColumn={showBarColumn}
        />
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => {
        if (!isBulkReturning) {
          setConfirmOpen(open);
          if (!open) {
            setResult(null);
            setPendingAction(null);
          }
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {result ? 'Resultado' : `Confirmar: ${pendingAction ? actionLabels[pendingAction] : ''}`}
            </DialogTitle>
            <DialogDescription>
              {result
                ? 'Resumen del procesamiento'
                : 'Revisá el detalle antes de confirmar.'}
            </DialogDescription>
          </DialogHeader>

          {bulkReturnProgress.total > 0 && (isBulkReturning || !!result) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="mb-2 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">
                  {isBulkReturning ? 'Procesando devoluciones...' : 'Procesamiento completado'}
                </span>
                <span>
                  {bulkReturnProgress.processed}/{bulkReturnProgress.total} items
                  {' · '}
                  Lote {Math.max(1, bulkReturnProgress.chunk)}/{Math.max(1, bulkReturnProgress.totalChunks)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/40">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      isBulkReturning
                        ? Math.max(
                            (bulkReturnProgress.processed / bulkReturnProgress.total) * 100,
                            8,
                          )
                        : (bulkReturnProgress.processed / bulkReturnProgress.total) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {result ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{result.processed} items procesados</span>
              </div>
              {result.toGlobal > 0 && (
                <p className="text-sm text-muted-foreground pl-7">
                  {result.toGlobal} devueltos al almacén general
                </p>
              )}
              {result.toSupplier > 0 && (
                <p className="text-sm text-muted-foreground pl-7">
                  {result.toSupplier} devueltos al proveedor
                </p>
              )}
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 mt-2">
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{result.errors.length} errores</span>
                  </div>
                  <ul className="text-xs text-destructive space-y-0.5 pl-6">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <DialogFooter className="pt-2">
                <Button onClick={() => { setConfirmOpen(false); setResult(null); }}>
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2">
                {pendingAction === 'auto' && (
                  <>
                    <div className="rounded-lg border p-3 space-y-2">
                      {returnablePurchased.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-green-600" />
                            Comprado &rarr; Almacén general
                          </span>
                          <Badge variant="secondary">{returnablePurchased.length} items</Badge>
                        </div>
                      )}
                      {returnableConsignment.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Undo2 className="h-4 w-4 text-orange-600" />
                            Consignación &rarr; Proveedor
                          </span>
                          <Badge variant="secondary">{returnableConsignment.length} items</Badge>
                        </div>
                      )}
                    </div>
                    {consumptionData.length > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        {consumptionData.length} {consumptionData.length === 1 ? 'insumo' : 'insumos'} consumidos durante el evento (no requieren devolución)
                      </p>
                    )}
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        El stock comprado volverá a estar disponible en tu almacén general.
                        El stock en consignación se eliminará de tu inventario.
                      </span>
                    </div>
                  </>
                )}

                {pendingAction === 'to_global' && (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm">
                      Se devolverán <span className="font-medium">{selectedPurchased.length} items comprados</span> al
                      almacén general.
                    </p>
                    {selectedConsignment.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedConsignment.length} items en consignación serán ignorados (usá "Devolver al proveedor" para esos).
                      </p>
                    )}
                  </div>
                )}

                {pendingAction === 'to_supplier' && (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm">
                      Se devolverán <span className="font-medium">{selectedConsignment.length} items en consignación</span> a
                      sus proveedores. Se eliminarán de tu inventario global.
                    </p>
                    {selectedPurchased.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedPurchased.length} items comprados serán ignorados (usá "Devolver al almacén" para esos).
                      </p>
                    )}
                  </div>
                )}

              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={isBulkReturning}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={executeAction}
                  disabled={isBulkReturning}
                >
                  {isBulkReturning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando {bulkReturnProgress.processed}/{bulkReturnProgress.total}...
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
