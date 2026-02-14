import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/dashbar';
import type { EventReportData, BucketSize } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportSummaryCards } from './ReportSummaryCards';
import { PeakHoursChart } from './PeakHoursChart';
import { TopProductsChart } from './TopProductsChart';
import { BarBreakdownTable } from './BarBreakdownTable';
import { PosBreakdownTable } from './PosBreakdownTable';
import { StockValuationTable } from './StockValuationTable';
import {
  AlertTriangle,
  Loader2,
  BarChart3,
  Clock,
  Trophy,
  Store,
  CreditCard,
  Package,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface EventReportTabProps {
  eventId: number;
  eventName: string;
}

export function EventReportTab({ eventId, eventName }: EventReportTabProps) {
  const [selectedBucket, setSelectedBucket] = useState<BucketSize>(15);
  const queryClient = useQueryClient();

  // Fetch report data
  const {
    data: report,
    isLoading,
    error,
  } = useQuery<EventReportData>({
    queryKey: ['report', eventId],
    queryFn: () => reportsApi.getReport(eventId),
    retry: false,
  });

  // Generate report mutation
  const generateReport = useMutation({
    mutationFn: () => reportsApi.generateReport(eventId),
    onSuccess: () => {
      toast.success('Reporte generado correctamente');
      queryClient.invalidateQueries({ queryKey: ['report', eventId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al generar el reporte');
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No report exists
  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <BarChart3 className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">No hay reporte disponible</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Una vez finalizado el evento, podés generar el reporte con el detalle completo.
        </p>
        <Button
          onClick={() => generateReport.mutate()}
          disabled={generateReport.isPending}
          className="gap-2"
        >
          {generateReport.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Generar reporte
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Reporte del Evento</h2>
        <p className="text-muted-foreground">{eventName}</p>
      </div>

      {/* Warnings */}
      {report.warnings && report.warnings.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="h-4 w-4" />
            Advertencias
          </div>
          <ul className="list-disc pl-6 mt-2 text-sm text-destructive/80">
            {report.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Cards */}
      <ReportSummaryCards summary={report.summary} />

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="peak-hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horas Pico</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="bars" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Barras</span>
          </TabsTrigger>
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">POS</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Stock</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {report.peakHoursByBucket && (
            <PeakHoursChart
              data={report.peakHoursByBucket}
              selectedBucket={selectedBucket}
              onBucketChange={setSelectedBucket}
            />
          )}
          <TopProductsChart data={report.topProducts} limit={10} />
        </TabsContent>

        <TabsContent value="peak-hours">
          {report.peakHoursByBucket ? (
            <PeakHoursChart
              data={report.peakHoursByBucket}
              selectedBucket={selectedBucket}
              onBucketChange={setSelectedBucket}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de horas pico disponibles
            </div>
          )}
        </TabsContent>

        <TabsContent value="products">
          <TopProductsChart data={report.topProducts} />
        </TabsContent>

        <TabsContent value="bars">
          {report.barBreakdowns && report.barBreakdowns.length > 0 ? (
            <BarBreakdownTable data={report.barBreakdowns} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de barras disponibles
            </div>
          )}
        </TabsContent>

        <TabsContent value="pos">
          {report.posBreakdowns && report.posBreakdowns.length > 0 ? (
            <PosBreakdownTable data={report.posBreakdowns} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de terminales POS disponibles
            </div>
          )}
        </TabsContent>

        <TabsContent value="stock">
          {report.stockValuation ? (
            <StockValuationTable data={report.stockValuation} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de stock disponibles
            </div>
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}
