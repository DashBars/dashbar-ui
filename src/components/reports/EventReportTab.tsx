import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/dashbar';
import type { EventReportData, BucketSize } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReportSummaryCards } from './ReportSummaryCards';
import { PeakHoursChart } from './PeakHoursChart';
import { TopProductsChart } from './TopProductsChart';
import { BarBreakdownTable } from './BarBreakdownTable';
import { PosBreakdownTable } from './PosBreakdownTable';
import { StockValuationTable } from './StockValuationTable';
import {
  FileText,
  AlertTriangle,
  Loader2,
  BarChart3,
  Clock,
  Trophy,
  Store,
  CreditCard,
  Package,
  Mail,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface EventReportTabProps {
  eventId: number;
  eventName: string;
}

export function EventReportTab({ eventId, eventName }: EventReportTabProps) {
  const [selectedBucket, setSelectedBucket] = useState<BucketSize>(15);
  const [isExporting, setIsExporting] = useState<'pdf' | null>(null);
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

  // PDF download with retry
  const handleExportPDF = async (retryCount = 0) => {
    setIsExporting('pdf');
    try {
      // First ensure report exists
      if (!report) {
        toast.error('No hay reporte disponible para descargar');
        setIsExporting(null);
        return;
      }

      const blob = await reportsApi.downloadPDF(eventId);
      
      // Validate blob is actually a PDF (not an error response)
      if (blob.size < 100) {
        throw new Error('El archivo PDF generado está vacío o corrupto');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${eventName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado exitosamente');
    } catch (err: any) {
      if (retryCount < 2) {
        // Retry up to 2 times
        toast.info('Reintentando descarga...');
        setTimeout(() => handleExportPDF(retryCount + 1), 1000);
        return;
      }
      toast.error(err.response?.data?.message || err.message || 'Error al descargar PDF. Intentá de nuevo más tarde.');
    } finally {
      if (retryCount >= 2 || retryCount === 0) {
        setIsExporting(null);
      }
    }
  };

  // Email state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const addRecipient = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email inválido');
      return;
    }
    if (recipients.includes(email)) {
      toast.error('Este email ya fue agregado');
      return;
    }
    setRecipients([...recipients, email]);
    setEmailInput('');
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      toast.error('Agregá al menos un destinatario');
      return;
    }
    setIsSendingEmail(true);
    try {
      const result = await reportsApi.sendReportEmail(eventId, recipients);
      toast.success(result.message);
      setEmailDialogOpen(false);
      setRecipients([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar el email');
    } finally {
      setIsSendingEmail(false);
    }
  };

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
          El reporte se genera automáticamente al finalizar el evento.
          Si no aparece, podés generarlo manualmente.
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
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reporte del Evento</h2>
          <p className="text-muted-foreground">{eventName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isExporting === 'pdf'}
          >
            {isExporting === 'pdf' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Descargar PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => setEmailDialogOpen(true)}
          >
            <Mail className="mr-2 h-4 w-4" />
            Enviar por email
          </Button>
        </div>
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

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Enviar reporte por email</DialogTitle>
            <DialogDescription>
              Ingresá los emails de los destinatarios. El reporte se enviará como PDF adjunto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="email@ejemplo.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addRecipient}>
                  Agregar
                </Button>
              </div>
            </div>

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipients.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="gap-1 pl-2 pr-1 py-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {recipients.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Escribí un email y presioná Enter o hacé clic en "Agregar"
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
              disabled={isSendingEmail}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={recipients.length === 0 || isSendingEmail}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar ({recipients.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
