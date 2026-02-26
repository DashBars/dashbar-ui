import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/dashbar';
import type {
  EventReportListItem,
  EligibleEventForComparison,
  EventComparisonReport,
} from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BarChart3,
  FileText,
  GitCompareArrows,
  Loader2,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowRight,
  Lightbulb,
  Clock,
  Trophy,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { toast } from 'sonner';

// ============= HELPERS =============

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return `AR$ ${dollars.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
];

// ============= REPORTS LIST TAB =============

function ReportsListTab() {
  const navigate = useNavigate();

  const { data: reports, isLoading } = useQuery<EventReportListItem[]>({
    queryKey: ['reports-list'],
    queryFn: () => reportsApi.getAllReports(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">No hay reportes generados</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Los reportes se generan desde la vista de detalle de cada evento finalizado.
          Navega a un evento terminado y genera su reporte.
        </p>
        <Button onClick={() => navigate('/events')}>
          Ir a Eventos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const marginPercent = report.totalRevenue > 0
            ? Math.round((report.grossProfit / report.totalRevenue) * 100)
            : 0;

          return (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/events/${report.eventId}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{report.event.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(report.event.finishedAt)}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Generado: {formatDate(report.generatedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Ingresos</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(report.totalRevenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Ganancia</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(report.grossProfit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Margen</div>
                    <div className="text-sm font-semibold">{marginPercent}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Ordenes</div>
                    <div className="text-sm font-semibold">{report.totalOrderCount.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Ver reporte completo <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============= COMPARISON TAB =============

function ComparisonTab() {
  const [selectedEventIds, setSelectedEventIds] = useState<Set<number>>(new Set());
  const [comparisonResult, setComparisonResult] = useState<EventComparisonReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: eligibleEvents, isLoading: isLoadingEligible } = useQuery<EligibleEventForComparison[]>({
    queryKey: ['eligible-comparison'],
    queryFn: () => reportsApi.getEligibleForComparison(),
  });

  const comparisonMutation = useMutation({
    mutationFn: (eventIds: number[]) => reportsApi.generateComparison(eventIds),
    onSuccess: (data) => {
      setComparisonResult(data);
      toast.success('Comparativa generada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar la comparativa');
    },
  });

  const toggleEvent = (eventId: number) => {
    const newSet = new Set(selectedEventIds);
    if (newSet.has(eventId)) {
      newSet.delete(eventId);
    } else {
      if (newSet.size >= 10) {
        toast.error('Maximo 10 eventos para comparar');
        return;
      }
      newSet.add(eventId);
    }
    setSelectedEventIds(newSet);
  };

  const handleGenerate = () => {
    if (selectedEventIds.size < 2) {
      toast.error('Selecciona al menos 2 eventos');
      return;
    }
    comparisonMutation.mutate(Array.from(selectedEventIds));
  };

  if (isLoadingEligible) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const eventsWithReport = (eligibleEvents || []).filter((e) => e.hasReport);

  if (eventsWithReport.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <GitCompareArrows className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">No hay suficientes eventos para comparar</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Necesitas al menos 2 eventos finalizados con reportes generados
          para crear una comparativa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5" />
            Seleccionar Eventos
          </CardTitle>
          <CardDescription>
            Selecciona entre 2 y 10 eventos finalizados para comparar sus metricas.
            {selectedEventIds.size > 0 && (
              <span className="ml-2 font-medium text-foreground">
                {selectedEventIds.size} seleccionado(s)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {eventsWithReport.map((event) => (
              <div
                key={event.eventId}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedEventIds.has(event.eventId)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent/50'
                }`}
                onClick={() => toggleEvent(event.eventId)}
              >
                <Checkbox
                  checked={selectedEventIds.has(event.eventId)}
                  onCheckedChange={() => toggleEvent(event.eventId)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{event.eventName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(event.startedAt)} - {formatDate(event.finishedAt)}
                    <span className="ml-2">({event.durationHours}h)</span>
                  </div>
                </div>
                {event.hasReport ? (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    Reporte listo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                    Sin reporte
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={selectedEventIds.size < 2 || comparisonMutation.isPending}
            >
              {comparisonMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GitCompareArrows className="mr-2 h-4 w-4" />
              )}
              Generar Comparativa ({selectedEventIds.size})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonResult && (
        <ComparisonResults
          data={comparisonResult}
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(!showDetails)}
        />
      )}
    </div>
  );
}

// ============= COMPARISON RESULTS =============

function ComparisonResults({
  data,
  showDetails,
  onToggleDetails,
}: {
  data: EventComparisonReport;
  showDetails: boolean;
  onToggleDetails: () => void;
}) {
  const sortedRows = [...data.eventComparison].sort(
    (a, b) => b.totalRevenue - a.totalRevenue,
  );
  const totals = sortedRows.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.totalRevenue,
      cogs: acc.cogs + row.totalCOGS,
      profit: acc.profit + row.grossProfit,
      orders: acc.orders + row.totalOrderCount,
      units: acc.units + row.totalUnitsSold,
    }),
    { revenue: 0, cogs: 0, profit: 0, orders: 0, units: 0 },
  );
  const avgMargin =
    sortedRows.length > 0
      ? Math.round(
          (sortedRows.reduce((sum, row) => sum + row.marginPercent, 0) /
            sortedRows.length) *
            100,
        ) / 100
      : 0;
  const bestRevenueRow = sortedRows[0];
  const bestMarginRow =
    sortedRows.length > 0
      ? sortedRows.reduce((best, row) =>
          row.marginPercent > best.marginPercent ? row : best,
        )
      : null;

  const readableInsights = data.insights
    .filter((insight) => {
      const totalEvents =
        Number(insight.data?.totalEvents) || sortedRows.length || 0;
      const eventsInTop5 = Math.min(
        Number(insight.data?.eventsInTop5) || 0,
        totalEvents,
      );
      const eventsWithPeak = Math.min(
        Number(insight.data?.eventsWithPeak) || 0,
        totalEvents,
      );

      // Extra guard against noisy insights in tiny samples.
      if (insight.type === 'peak_time_pattern' && eventsWithPeak < 2) {
        return false;
      }
      if (insight.type === 'consistent_top_product' && eventsInTop5 < 2) {
        return false;
      }
      return true;
    })
    .map((insight) => {
      if (insight.type === 'consistent_top_product') {
        const totalEvents =
          Number(insight.data?.totalEvents) || sortedRows.length || 0;
        const eventsInTop5 = Math.min(
          Number(insight.data?.eventsInTop5) || 0,
          totalEvents,
        );
        return `Producto consistente: ${insight.data.name} aparece en top 5 en ${eventsInTop5}/${totalEvents} eventos (share promedio ${insight.data.avgSharePercent}%).`;
      }
      if (insight.type === 'peak_time_pattern') {
        const hour = String(insight.data.hourOfDay).padStart(2, '0');
        const totalEvents =
          Number(insight.data?.totalEvents) || sortedRows.length || 0;
        const eventsWithPeak = Math.min(
          Number(insight.data?.eventsWithPeak) || 0,
          totalEvents,
        );
        return `Patron horario: el pico se concentra cerca de las ${hour}:00 en ${eventsWithPeak}/${totalEvents} eventos.`;
      }
      if (insight.type === 'margin_outlier') {
        return `Margen atipico: ${insight.data.eventName} (${insight.data.marginPercent}%) vs promedio ${Math.round(insight.data.avgMargin)}%.`;
      }
      if (insight.type === 'volume_outlier') {
        return `Volumen atipico: ${insight.data.eventName} con ${insight.data.unitsPerHour} uds/h vs promedio ${Math.round(insight.data.avgUnitsPerHour)} uds/h.`;
      }
      return insight.message;
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Executive summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Eventos comparados</div>
            <div className="mt-1 text-2xl font-semibold">{sortedRows.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Base de comparacion actual
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Ingresos totales</div>
            <div className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(totals.revenue)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Ganancia total: {formatCurrency(totals.profit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Mejor evento (ingresos)</div>
            <div className="mt-1 text-base font-semibold truncate">
              {bestRevenueRow?.eventName ?? '-'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {bestRevenueRow ? formatCurrency(bestRevenueRow.totalRevenue) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Mejor margen</div>
            <div className="mt-1 text-base font-semibold truncate">
              {bestMarginRow?.eventName ?? '-'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Promedio: {avgMargin}% · Top: {bestMarginRow?.marginPercent ?? 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {readableInsights.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Lightbulb className="h-5 w-5" />
              Insights clave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-amber-800/80 dark:text-amber-300/80">
              Resumen automatico sobre patrones repetidos entre los eventos seleccionados.
            </p>
            <div className="space-y-3">
              {readableInsights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border"
                >
                  <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{insight}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tabla Comparativa
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onToggleDetails}>
              {showDetails ? (
                <>Ocultar detalles <ChevronUp className="ml-1 h-4 w-4" /></>
              ) : (
                <>Ver detalles <ChevronDown className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 text-xs text-muted-foreground">
            Ordenado por <span className="font-medium">ingresos</span> de mayor a menor.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Evento</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ingresos</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">COGS</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ganancia</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Margen</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Unidades</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ordenes</th>
                  {showDetails && (
                    <>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">$/hora</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Uds/hora</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ord/hora</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Duracion</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, idx) => (
                  <tr key={row.eventId} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 pr-3">
                      <Badge variant={idx === 0 ? 'default' : 'outline'}>
                        {idx + 1}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span className="font-medium">{row.eventName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(row.startedAt)}
                      </div>
                    </td>
                    <td className="text-right py-3 px-3 font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(row.totalRevenue)}
                    </td>
                    <td className="text-right py-3 px-3 text-red-600 dark:text-red-400">
                      {formatCurrency(row.totalCOGS)}
                    </td>
                    <td className="text-right py-3 px-3 font-medium">
                      {formatCurrency(row.grossProfit)}
                    </td>
                    <td className="text-right py-3 px-3">
                      <Badge
                        variant="outline"
                        className={
                          row.marginPercent >= 50
                            ? 'text-green-600 border-green-200'
                            : row.marginPercent >= 30
                            ? 'text-yellow-600 border-yellow-200'
                            : 'text-red-600 border-red-200'
                        }
                      >
                        {row.marginPercent}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-3">{row.totalUnitsSold.toLocaleString()}</td>
                    <td className="text-right py-3 px-3">{row.totalOrderCount.toLocaleString()}</td>
                    {showDetails && (
                      <>
                        <td className="text-right py-3 px-3">{formatCurrency(row.revenuePerHour)}</td>
                        <td className="text-right py-3 px-3">{row.unitsPerHour}</td>
                        <td className="text-right py-3 px-3">{row.ordersPerHour}</td>
                        <td className="text-right py-3 px-3">{row.durationHours}h</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Comparativa de Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.eventComparison}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="eventName" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(value as number),
                    name === 'totalRevenue' ? 'Ingresos' : name === 'totalCOGS' ? 'COGS' : 'Ganancia',
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === 'totalRevenue' ? 'Ingresos' : value === 'totalCOGS' ? 'COGS' : 'Ganancia'
                  }
                />
                <Bar dataKey="totalRevenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalCOGS" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="grossProfit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cross-Event Products */}
      {data.crossEventProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Productos Cross-Evento
            </CardTitle>
            <CardDescription>
              Productos presentes en varios eventos, consolidando una unica fila por evento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.crossEventProducts.slice(0, 10).map((product) => (
                <div key={product.cocktailId || product.name} className="border rounded-lg p-4">
                  {(() => {
                    const uniqueEventRows = Array.from(
                      product.byEvent.reduce((acc, evt) => {
                        const prev = acc.get(evt.eventId);
                        if (!prev) {
                          acc.set(evt.eventId, { ...evt });
                          return acc;
                        }
                        // Defensive UI merge in case backend sends duplicates.
                        acc.set(evt.eventId, {
                          ...prev,
                          unitsSold: prev.unitsSold + evt.unitsSold,
                          revenue: prev.revenue + evt.revenue,
                          sharePercent: Math.max(prev.sharePercent, evt.sharePercent),
                          rank: Math.min(prev.rank, evt.rank),
                        });
                        return acc;
                      }, new Map<number, (typeof product.byEvent)[number]>()),
                    )
                      .map(([, value]) => value)
                      .sort((a, b) => b.revenue - a.revenue);

                    const uniqueEventCount = uniqueEventRows.length;

                    return (
                      <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{product.name}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {uniqueEventCount} evento(s)
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Promedio: {product.avgSharePercent}% del total
                      </span>
                    </div>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Se muestra 1 tarjeta por evento comparado para este producto.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {uniqueEventRows.map((evt) => (
                        <div
                          key={evt.eventId}
                          className="p-2 bg-slate-50 dark:bg-slate-900 rounded"
                        >
                          <div className="text-xs text-muted-foreground truncate">{evt.eventName}</div>
                          <div className="font-medium">{evt.unitsSold} unid.</div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {formatCurrency(evt.revenue)} ({evt.sharePercent}%)
                          </div>
                          <div className="text-xs text-muted-foreground">Ranking: #{evt.rank}</div>
                        </div>
                      ))}
                  </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Series Overlay */}
      {data.timeSeriesByEvent.length > 0 && data.timeSeriesByEvent.some((ts) => ts.series.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Curvas de Ventas por Evento
            </CardTitle>
            <CardDescription>
              Comparativa de series de tiempo de ventas (agrupado por hora relativa desde inicio)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeSeriesOverlayChart data={data} />
          </CardContent>
        </Card>
      )}

      {/* Peak Time Patterns */}
      {data.peakTimePatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Patrones de Horarios Pico
            </CardTitle>
            <CardDescription>
              Horas del dia donde se concentra la actividad maxima en multiples eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-muted-foreground">
              Eventos seleccionados: {data.eventComparison.map((e) => e.eventName).join(' · ')}
            </p>
            <div className="space-y-2">
              {data.peakTimePatterns.slice(0, 4).map((pattern) => (
                <div key={pattern.hourOfDay} className="flex items-center gap-3 p-2.5 border rounded-lg">
                  <div className="w-14 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-md flex items-center justify-center">
                    <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {pattern.hourOfDay.toString().padStart(2, '0')}:00
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      Pico en {pattern.eventsWithPeak} de {data.eventComparison.length} eventos
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {pattern.eventsWithPeak === 1
                        ? `Solo en: ${pattern.eventDetails[0]?.eventName || '-'}`
                        : `En: ${pattern.eventDetails.map((d) => d.eventName).join(', ')}`}
                    </div>
                  </div>
                  <Badge
                    variant={pattern.eventsWithPeak >= data.eventComparison.length / 2 ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {Math.round((pattern.eventsWithPeak / data.eventComparison.length) * 100)}% consistencia
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============= TIME SERIES OVERLAY CHART =============

function TimeSeriesOverlayChart({ data }: { data: EventComparisonReport }) {
  // Normalize time series to relative hours from event start
  const normalizedData: Record<number, Record<string, number>> = {};

  data.timeSeriesByEvent.forEach((eventTs) => {
    if (eventTs.series.length === 0) return;
    const firstTimestamp = new Date(eventTs.series[0].timestamp).getTime();

    eventTs.series.forEach((point) => {
      const relativeHour = Math.round(
        (new Date(point.timestamp).getTime() - firstTimestamp) / 3600000
      );
      if (!normalizedData[relativeHour]) {
        normalizedData[relativeHour] = { hour: relativeHour } as any;
      }
      normalizedData[relativeHour][eventTs.eventName] = point.amount / 100; // Convert cents to dollars
    });
  });

  const chartData = Object.values(normalizedData).sort(
    (a: any, b: any) => a.hour - b.hour
  );

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No hay datos de series de tiempo para mostrar
      </div>
    );
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="hour"
            tickFormatter={(v) => `Hora ${v}`}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v) => `AR$ ${v.toLocaleString('es-AR')}`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value, name) => [
              `AR$ ${(value as number).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`,
              name as string,
            ]}
            labelFormatter={(label) => `Hora ${label} desde inicio`}
          />
          <Legend />
          {data.timeSeriesByEvent.map((eventTs, idx) => (
            <Line
              key={eventTs.eventId}
              type="monotone"
              dataKey={eventTs.eventName}
              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============= INSIGHT ICON =============

function InsightIcon({ type }: { type: string }) {
  switch (type) {
    case 'consistent_top_product':
      return <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />;
    case 'peak_time_pattern':
      return <Clock className="h-5 w-5 text-blue-500 shrink-0" />;
    case 'margin_outlier':
      return <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />;
    case 'volume_outlier':
      return <TrendingUp className="h-5 w-5 text-purple-500 shrink-0" />;
    default:
      return <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />;
  }
}

// ============= MAIN PAGE =============

export function ReportsPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground mt-1">
          Analisis post-evento y comparativas entre eventos
        </p>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Mis Reportes
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4" />
            Comparativa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <ReportsListTab />
        </TabsContent>

        <TabsContent value="comparison">
          <ComparisonTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
