import { useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBars } from '@/hooks/useBars';
import { useEventPosnets } from '@/hooks/usePosnets';
import { useEventDashboard } from '@/hooks/useEventDashboard';
import type { Bar, Posnet, PosnetStatus } from '@/lib/api/types';
import type { RecentSale, LiveAlert, PosLiveMetrics } from '@/hooks/useEventDashboard';

interface EventMonitoringTabProps {
  eventId: number;
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

  // Stable color per bar
  const barColorMap = useMemo(() => {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
      'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
    ];
    const map = new Map<number, string>();
    bars.forEach((b, i) => map.set(b.id, colors[i % colors.length]));
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
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${barColorMap.get(sale.barId) || 'bg-gray-400'}`} />
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

function AlertsFeed({ alerts }: { alerts: LiveAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground justify-center">
        <AlertTriangle className="h-4 w-4 opacity-40" />
        <p className="text-sm">Sin alertas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
      {alerts.map((alert, idx) => (
        <div
          key={`${alert.id}-${idx}`}
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2 animate-in slide-in-from-top-2 duration-300"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{alert.message}</p>
            <p className="text-xs text-muted-foreground">
              {alert.barName} &middot; {alert.drinkName} &middot; {timeAgo(alert.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──

export function EventMonitoringTab({ eventId }: EventMonitoringTabProps) {
  const { data: bars = [], isLoading: barsLoading } = useBars(eventId);
  const { data: posnets = [], isLoading: posnetsLoading } = useEventPosnets(eventId);

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
          Actualización automática cada 60s
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

      {/* Row 2: Live Sales + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ventas en tiempo real
              {recentSales.length > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {recentSales.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LiveSalesFeed sales={recentSales} bars={bars} />
          </CardContent>
        </Card>

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
      </div>

      {/* Row 3: Bar Status + POS Status */}
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

      {/* Row 4: Alerts */}
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
          <AlertsFeed alerts={alerts} />
        </CardContent>
      </Card>
    </div>
  );
}
