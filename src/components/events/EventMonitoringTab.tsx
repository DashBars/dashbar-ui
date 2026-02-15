import React, { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Droplets,
  Wifi,
  WifiOff,
  Monitor,
  AlertTriangle,
  TrendingUp,
  Clock,
  BarChart3,
  Store,
  ChevronDown,
  ChevronUp,
  List,
  ArrowRightLeft,
  Wine,
  Boxes,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useBars } from '@/hooks/useBars';
import { useEventPosnets } from '@/hooks/usePosnets';
import { useEventDashboard } from '@/hooks/useEventDashboard';
import { useAlerts, useThresholds } from '@/hooks/useAlarms';
import type { Bar, Posnet, PosnetStatus, StockAlert, StockThreshold } from '@/lib/api/types';
import type { RecentSale, LiveAlert, PosLiveMetrics } from '@/hooks/useEventDashboard';

interface EventMonitoringTabProps {
  eventId: number;
  onNavigateToAlarms?: () => void;
}

// ── Helpers ──

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatLiters(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} L`;
  return `${Math.round(ml)} ml`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function posStatusLabel(status: PosnetStatus): string {
  const labels: Record<PosnetStatus, string> = {
    OPEN: 'Activo',
    CLOSED: 'Cerrado',
    CONGESTED: 'Congestionado',
  };
  return labels[status] || status;
}

function posStatusColor(status: PosnetStatus): string {
  const colors: Record<PosnetStatus, string> = {
    OPEN: 'bg-green-500',
    CLOSED: 'bg-gray-400',
    CONGESTED: 'bg-amber-500',
  };
  return colors[status] || 'bg-gray-400';
}

function barStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">Abierta</Badge>;
    case 'lowStock':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400">Stock bajo</Badge>;
    default:
      return <Badge variant="secondary">Cerrada</Badge>;
  }
}

// ── Subcomponents ──

function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
  color,
  isLoading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  subtitle?: string;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tracking-tight">{value}</p>
            )}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-4.5 w-4.5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveSalesFeed({ sales, bars }: { sales: RecentSale[]; bars: Bar[] }) {
  const barNameMap = useMemo(() => {
    const map = new Map<number, string>();
    bars.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [bars]);

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <ShoppingCart className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Esperando ventas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
      {sales.map((sale, idx) => (
        <div
          key={`${sale.id}-${idx}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors animate-in slide-in-from-top-2 duration-300"
        >
          {sale.isDirectSale ? (
            <Package className="h-3.5 w-3.5 text-green-600 shrink-0" />
          ) : (
            <Wine className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{sale.cocktailName}</p>
            <p className="text-xs text-muted-foreground">
              {sale.barName || barNameMap.get(sale.barId) || 'Barra'} &middot; x{sale.quantity}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold">{formatCurrency(sale.totalAmount)}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(sale.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SaleTypeBadge({ isDirectSale }: { isDirectSale?: boolean }) {
  if (isDirectSale) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 text-[10px] gap-0.5">
        <Package className="h-3 w-3" />
        Directa
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 text-[10px] gap-0.5">
      <Wine className="h-3 w-3" />
      Coctel
    </Badge>
  );
}

function SalesTable({ sales, bars }: { sales: RecentSale[]; bars: Bar[] }) {
  const barNameMap = useMemo(() => {
    const map = new Map<number, string>();
    bars.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [bars]);

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <ShoppingCart className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Esperando ventas...</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        Mostrando {sales.length} venta{sales.length !== 1 ? 's' : ''} reciente{sales.length !== 1 ? 's' : ''}
      </p>
      <div className="rounded-md border max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Barra</TableHead>
              <TableHead className="text-center">Cant.</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale, idx) => (
              <TableRow
                key={`${sale.id}-${idx}`}
                className="animate-in slide-in-from-top-1 duration-200"
              >
                <TableCell className="font-medium">
                  {sale.cocktailName}
                </TableCell>
                <TableCell>
                  <SaleTypeBadge isDirectSale={sale.isDirectSale} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {sale.barName || barNameMap.get(sale.barId) || 'Barra'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    x{sale.quantity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(sale.totalAmount)}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {new Date(sale.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Collapsible Sales Card ──

function CollapsibleSalesCard({ sales, bars }: { sales: RecentSale[]; bars: Bar[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="rounded-2xl">
      <button
        type="button"
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors rounded-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-base font-semibold">
          <List className="h-4 w-4" />
          Registro de ventas en tiempo real
          {sales.length > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-1">
              {sales.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {isOpen && (
        <CardContent className="pt-0">
          <SalesTable sales={sales} bars={bars} />
        </CardContent>
      )}
    </Card>
  );
}

// ── Collapsible Stock Card ──

function CollapsibleStockCard({ bars, thresholds, isLoading }: { bars: Bar[]; thresholds: StockThreshold[]; isLoading: boolean }) {
  const [isOpen, setIsOpen] = useState(true);

  const criticalCount = useMemo(() => {
    if (!bars.length || !thresholds.length) return 0;
    const thresholdMap = new Map<string, number>();
    thresholds.forEach((t) => thresholdMap.set(`${t.drinkId}-${t.sellAsWholeUnit}`, t.lowerThreshold));
    const agg = new Map<string, { ml: number; vol: number }>();
    bars.forEach((bar) => {
      (bar.stocks || []).forEach((s: any) => {
        const key = `${s.drinkId}-${s.sellAsWholeUnit}`;
        const ex = agg.get(key);
        if (ex) ex.ml += s.quantity;
        else agg.set(key, { ml: s.quantity, vol: s.drink?.volume ?? 1 });
      });
    });
    let count = 0;
    for (const [key, data] of agg.entries()) {
      const th = thresholdMap.get(key);
      if (th != null && Math.floor(data.ml / data.vol) <= th) count++;
    }
    return count;
  }, [bars, thresholds]);

  return (
    <Card className="rounded-2xl">
      <button
        type="button"
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors rounded-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-base font-semibold">
          <Boxes className="h-4 w-4" />
          Stock en tiempo real
          {criticalCount > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 text-[10px] ml-1">
              {criticalCount} critico{criticalCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {isOpen && (
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : (
            <StockOverviewTable bars={bars} thresholds={thresholds} />
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Stock Overview Table ──

interface StockRow {
  drinkId: number;
  drinkName: string;
  drinkBrand: string;
  drinkVolume: number;
  sellAsWholeUnit: boolean;
  totalMl: number;
  units: number;
  threshold: number | null;
  perBar: Array<{ barId: number; barName: string; ml: number; units: number }>;
}

function stockStatusBadge(units: number, threshold: number | null): React.ReactNode {
  if (threshold == null) return <Badge variant="secondary" className="text-[10px]">Sin umbral</Badge>;
  if (units <= threshold) return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 text-[10px]">Critico</Badge>;
  if (units <= threshold * 1.5) return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 text-[10px]">Bajo</Badge>;
  return <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 text-[10px]">OK</Badge>;
}

function stockRowBg(units: number, threshold: number | null): string {
  if (threshold != null && units <= threshold) return 'bg-red-50/50 dark:bg-red-950/10';
  if (threshold != null && units <= threshold * 1.5) return 'bg-amber-50/50 dark:bg-amber-950/10';
  return '';
}

function StockOverviewTable({ bars, thresholds }: { bars: Bar[]; thresholds: StockThreshold[] }) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const thresholdMap = useMemo(() => {
    const map = new Map<string, number>();
    thresholds.forEach((t) => {
      map.set(`${t.drinkId}-${t.sellAsWholeUnit}`, t.lowerThreshold);
    });
    return map;
  }, [thresholds]);

  const rows = useMemo(() => {
    const agg = new Map<string, StockRow>();

    bars.forEach((bar) => {
      (bar.stocks || []).forEach((s: any) => {
        const key = `${s.drinkId}-${s.sellAsWholeUnit}`;
        const drinkVol = s.drink?.volume ?? 1;
        const barEntry = { barId: bar.id, barName: bar.name, ml: s.quantity as number, units: Math.floor((s.quantity as number) / drinkVol) };
        const existing = agg.get(key);
        if (existing) {
          existing.totalMl += s.quantity;
          existing.units = Math.floor(existing.totalMl / drinkVol);
          existing.perBar.push(barEntry);
        } else {
          agg.set(key, {
            drinkId: s.drinkId,
            drinkName: s.drink?.name ?? `Drink #${s.drinkId}`,
            drinkBrand: s.drink?.brand ?? '',
            drinkVolume: drinkVol,
            sellAsWholeUnit: s.sellAsWholeUnit ?? false,
            totalMl: s.quantity,
            units: Math.floor(s.quantity / drinkVol),
            threshold: thresholdMap.get(key) ?? null,
            perBar: [barEntry],
          });
        }
      });
    });

    for (const [key, row] of agg.entries()) {
      row.threshold = thresholdMap.get(key) ?? null;
    }

    return Array.from(agg.values()).sort((a, b) => a.drinkName.localeCompare(b.drinkName));
  }, [bars, thresholdMap]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Boxes className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Sin datos de stock</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border max-h-[500px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]"></TableHead>
            <TableHead>Insumo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Stock (un.)</TableHead>
            <TableHead className="text-right">Umbral (un.)</TableHead>
            <TableHead className="text-center">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const key = `${row.drinkId}-${row.sellAsWholeUnit}`;
            const isExpanded = expandedKey === key;
            const hasBars = row.perBar.length > 1;

            return (
              <React.Fragment key={key}>
                <TableRow
                  className={`${stockRowBg(row.units, row.threshold)} ${hasBars ? 'cursor-pointer hover:bg-muted/40' : ''}`}
                  onClick={() => hasBars && setExpandedKey(isExpanded ? null : key)}
                >
                  <TableCell className="w-[30px] px-2">
                    {hasBars && (
                      isExpanded
                        ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{row.drinkName}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.drinkBrand} &middot; {row.drinkVolume} ml
                        {hasBars && <span className="ml-1">({row.perBar.length} barras)</span>}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.sellAsWholeUnit ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 text-[10px] gap-0.5">
                        <Package className="h-3 w-3" />
                        Directa
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 text-[10px] gap-0.5">
                        <Wine className="h-3 w-3" />
                        Recetas
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {row.units}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {row.threshold != null ? row.threshold : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {stockStatusBadge(row.units, row.threshold)}
                  </TableCell>
                </TableRow>
                {isExpanded && row.perBar.map((bar) => (
                  <TableRow
                    key={`${key}-bar-${bar.barId}`}
                    className={`${stockRowBg(bar.units, row.threshold)} bg-muted/20`}
                  >
                    <TableCell></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 pl-2">
                        <Store className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">{bar.barName}</span>
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {bar.units}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {row.threshold != null ? row.threshold : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {stockStatusBadge(bar.units, row.threshold)}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function TopProductsList({ products }: { products: Array<{ name: string; units: number; amount: number }> }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <BarChart3 className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Sin datos aún</p>
      </div>
    );
  }

  const maxUnits = Math.max(...products.map((p) => p.units), 1);

  return (
    <div className="space-y-3">
      {products.map((product, idx) => (
        <div key={product.cocktailId ?? idx} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
              <span className="text-sm font-medium truncate">{product.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{product.units} un.</span>
              <span className="text-sm font-semibold">{formatCurrency(product.amount)}</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden ml-6">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(product.units / maxUnits) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BarStatusGrid({ bars }: { bars: Bar[] }) {
  if (bars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Store className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Sin barras</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {bars.map((bar) => (
        <div
          key={bar.id}
          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{bar.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {bar.type}
              </Badge>
            </div>
          </div>
          {barStatusBadge(bar.status)}
        </div>
      ))}
    </div>
  );
}

function PosStatusGrid({
  posnets,
  liveMetrics,
  bars,
}: {
  posnets: Posnet[];
  liveMetrics: Map<number, PosLiveMetrics>;
  bars: Bar[];
}) {
  const barNameMap = useMemo(() => {
    const map = new Map<number, string>();
    bars.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [bars]);

  if (posnets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Monitor className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Sin terminales POS</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {posnets.map((pos) => {
        const live = liveMetrics.get(pos.id);
        const status = live?.status ?? pos.status;
        const traffic = live?.traffic ?? pos.traffic ?? 0;
        const maxTraffic = 100; // normalize traffic bar to 0-100

        return (
          <div
            key={pos.id}
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
          >
            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${posStatusColor(status)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{pos.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {pos.bar?.name || barNameMap.get(pos.barId) || 'Barra'}
              </p>
              {/* Traffic bar */}
              <div className="h-1 rounded-full bg-muted overflow-hidden mt-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    traffic > 70 ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min((traffic / maxTraffic) * 100, 100)}%` }}
                />
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] shrink-0 ${
                status === 'OPEN'
                  ? 'border-green-300 text-green-700 dark:text-green-400'
                  : status === 'CONGESTED'
                    ? 'border-amber-300 text-amber-700 dark:text-amber-400'
                    : ''
              }`}
            >
              {posStatusLabel(status)}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

function AlertsFeed({
  alerts,
  fullAlerts,
  onViewAll,
}: {
  alerts: LiveAlert[];
  fullAlerts: StockAlert[];
  onViewAll?: () => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Merge donor info from fullAlerts into matching LiveAlerts
  const donorsMap = useMemo(() => {
    const map = new Map<number, StockAlert>();
    fullAlerts.forEach((a) => map.set(a.id, a));
    return map;
  }, [fullAlerts]);

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground justify-center">
        <AlertTriangle className="h-4 w-4 opacity-40" />
        <p className="text-sm">Sin alertas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
      {alerts.map((alert, idx) => {
        const full = donorsMap.get(alert.id);
        const hasDonors =
          full?.suggestedDonors && full.suggestedDonors.length > 0;
        const isExpanded = expandedId === alert.id;

        return (
          <div
            key={`${alert.id}-${idx}`}
            className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 animate-in slide-in-from-top-2 duration-300"
          >
            <div className="flex items-start gap-3 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  {alert.barName} &middot; {alert.drinkName} &middot;{' '}
                  {timeAgo(alert.createdAt)}
                </p>
              </div>
              {hasDonors && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : alert.id)
                  }
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
            {isExpanded && full?.suggestedDonors && (
              <div className="px-3 pb-2 border-t border-amber-200 dark:border-amber-800 pt-2 space-y-1">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  Barras con excedente:
                </p>
                {full.suggestedDonors.map((d) => (
                  <div
                    key={d.barId}
                    className="flex items-center gap-2 text-xs"
                  >
                    <ArrowRightLeft className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-medium">{d.barName}</span>
                    <span className="text-muted-foreground">
                      &middot; Excedente: {d.availableSurplus} un.
                      &middot; Sugerido: {d.suggestedQuantity} un.
                    </span>
                  </div>
                ))}
                {full.externalNeeded && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Se necesita stock externo
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {onViewAll && (
        <div className="text-center pt-1">
          <Button
            variant="link"
            size="sm"
            className="text-xs h-auto p-0"
            onClick={onViewAll}
          >
            Ver todas las alarmas
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──

export function EventMonitoringTab({ eventId, onNavigateToAlarms }: EventMonitoringTabProps) {
  const { data: bars = [], isLoading: barsLoading } = useBars(eventId);
  const { data: posnets = [], isLoading: posnetsLoading } = useEventPosnets(eventId);
  const { data: fullAlerts = [] } = useAlerts(eventId);
  const { data: thresholds = [] } = useThresholds(eventId);

  const {
    totals,
    topProducts,
    recentSales,
    posMetrics,
    alerts,
    connected,
    isLoading,
    updateBarNames,
  } = useEventDashboard(eventId);

  // Feed bar names to the dashboard hook for display in sales
  useEffect(() => {
    if (bars.length > 0) {
      updateBarNames(bars);
    }
  }, [bars, updateBarNames]);

  return (
    <div className="space-y-4">
      {/* Connection indicator */}
      <div className="flex items-center gap-2">
        {connected ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">En vivo</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Conectando...</span>
          </>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          <Clock className="h-3 w-3 inline mr-1" />
          Actualización automática cada 10s
        </span>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          title="Ventas totales"
          value={totals ? formatCurrency(totals.sales.totalAmount) : '$0'}
          icon={DollarSign}
          color="bg-emerald-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Unidades vendidas"
          value={totals ? totals.sales.totalUnits.toLocaleString('es-AR') : '0'}
          icon={Package}
          color="bg-blue-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Órdenes"
          value={totals ? totals.sales.orderCount.toLocaleString('es-AR') : '0'}
          icon={ShoppingCart}
          color="bg-violet-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Consumo total"
          value={totals ? formatLiters(totals.consumption.totalMl) : '0 ml'}
          icon={Droplets}
          color="bg-cyan-500"
          isLoading={isLoading}
        />
      </div>

      {/* Row 2: Stock overview (event-level, collapsible) */}
      <CollapsibleStockCard bars={bars} thresholds={thresholds} isLoading={barsLoading} />

      {/* Row 3: Sales Table (full width, collapsible card) */}
      <CollapsibleSalesCard sales={recentSales} bars={bars} />

      {/* Row 4: Top Products */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Top productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          ) : (
            <TopProductsList products={topProducts} />
          )}
        </CardContent>
      </Card>

      {/* Row 5: Bar Status + POS Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4" />
              Estado de barras
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {bars.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <BarStatusGrid bars={bars} />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Terminales POS
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {posnets.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {posnetsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <PosStatusGrid posnets={posnets} liveMetrics={posMetrics} bars={bars} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Alerts */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas recientes
            {alerts.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] ml-auto border-amber-300 text-amber-700 dark:text-amber-400"
              >
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertsFeed alerts={alerts} fullAlerts={fullAlerts} onViewAll={onNavigateToAlarms} />
        </CardContent>
      </Card>
    </div>
  );
}
