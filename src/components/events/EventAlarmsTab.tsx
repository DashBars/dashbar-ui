import { useState, useMemo, useCallback } from 'react';
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Info,
  Package,
  Wine,
  Settings2,
  Warehouse,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';

import {
  useThresholds,
  useCreateThreshold,
  useUpdateThreshold,
  useDeleteThreshold,
  useAlerts,
  useAcknowledgeAlert,
  useForceCheck,
} from '@/hooks/useAlarms';
import { useBars } from '@/hooks/useBars';
import { transfersApi } from '@/lib/api/dashbar';
import type {
  StockThreshold,
  StockAlert,
  DonorSuggestion,
  Drink,
  AlertStatus,
  AlertType,
} from '@/lib/api/types';

// ── Helpers ──

function stockTypeLabel(sellAsWholeUnit: boolean) {
  return sellAsWholeUnit ? 'Venta directa' : 'Para recetas';
}

function stockTypeBadge(sellAsWholeUnit: boolean) {
  return sellAsWholeUnit ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 text-[10px]">
      <Package className="h-3 w-3 mr-0.5" />
      Venta directa
    </Badge>
  ) : (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 text-[10px]">
      <Wine className="h-3 w-3 mr-0.5" />
      Recetas
    </Badge>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `hace ${hours}h ${minutes % 60}m`;
}

function alertTypeBadge(type: AlertType) {
  switch (type) {
    case 'low_stock':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400">
          Stock bajo
        </Badge>
      );
    case 'projected_depletion':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400">
          Agotamiento proyectado
        </Badge>
      );
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

function alertStatusBadge(status: AlertStatus) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400">
          Activa
        </Badge>
      );
    case 'acknowledged':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400">
          Reconocida
        </Badge>
      );
    case 'resolved':
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
          Resuelta
        </Badge>
      );
    case 'expired':
      return <Badge variant="secondary">Expirada</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

// ── Props ──

interface EventAlarmsTabProps {
  eventId: number;
  isActive: boolean;
}

// ── Threshold Form Dialog ──

interface ThresholdFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: number;
  editing?: StockThreshold | null;
  /** Keys already taken: "drinkId-sellAsWholeUnit" */
  existingKeys: Set<string>;
  availableDrinks: Drink[];
}

function ThresholdFormDialog({
  open,
  onOpenChange,
  eventId,
  editing,
  existingKeys,
  availableDrinks,
}: ThresholdFormProps) {
  const [drinkId, setDrinkId] = useState<number | ''>(editing?.drinkId ?? '');
  const [sellAsWholeUnit, setSellAsWholeUnit] = useState<boolean>(
    editing?.sellAsWholeUnit ?? true,
  );
  const [lowerThreshold, setLowerThreshold] = useState(
    editing ? String(editing.lowerThreshold) : '',
  );
  const [donationThreshold, setDonationThreshold] = useState(
    editing ? String(editing.donationThreshold) : '',
  );
  const [depletionHorizon, setDepletionHorizon] = useState(
    editing?.depletionHorizonMin ? String(editing.depletionHorizonMin) : '',
  );

  const createMutation = useCreateThreshold(eventId);
  const updateMutation = useUpdateThreshold(eventId);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Check if the selected drink+type combination already has a threshold
  const isDuplicate = useMemo(() => {
    if (editing) return false;
    if (!drinkId) return false;
    return existingKeys.has(`${drinkId}-${sellAsWholeUnit}`);
  }, [drinkId, sellAsWholeUnit, existingKeys, editing]);

  const handleSave = useCallback(() => {
    const lower = parseInt(lowerThreshold, 10);
    const donation = parseInt(donationThreshold, 10);
    const horizon = depletionHorizon ? parseInt(depletionHorizon, 10) : undefined;

    if (!editing && !drinkId) {
      toast.error('Selecciona un insumo');
      return;
    }
    if (isNaN(lower) || lower < 0) {
      toast.error('El umbral minimo debe ser mayor o igual a 0');
      return;
    }
    if (isNaN(donation) || donation < 0) {
      toast.error('El umbral de donacion debe ser mayor o igual a 0');
      return;
    }
    if (donation < lower) {
      toast.error('El umbral de donacion debe ser mayor o igual al umbral minimo');
      return;
    }
    if (isDuplicate) {
      toast.error('Ya existe un umbral para este insumo y tipo de stock');
      return;
    }

    if (editing) {
      updateMutation.mutate(
        {
          drinkId: editing.drinkId,
          sellAsWholeUnit: editing.sellAsWholeUnit,
          dto: {
            lowerThreshold: lower,
            donationThreshold: donation,
            depletionHorizonMin: horizon,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(
        {
          drinkId: drinkId as number,
          sellAsWholeUnit,
          lowerThreshold: lower,
          donationThreshold: donation,
          depletionHorizonMin: horizon,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }, [
    editing,
    drinkId,
    sellAsWholeUnit,
    lowerThreshold,
    donationThreshold,
    depletionHorizon,
    isDuplicate,
    createMutation,
    updateMutation,
    onOpenChange,
  ]);

  const resetForm = useCallback(() => {
    setDrinkId(editing?.drinkId ?? '');
    setSellAsWholeUnit(editing?.sellAsWholeUnit ?? true);
    setLowerThreshold(editing ? String(editing.lowerThreshold) : '');
    setDonationThreshold(editing ? String(editing.donationThreshold) : '');
    setDepletionHorizon(
      editing?.depletionHorizonMin ? String(editing.depletionHorizonMin) : '',
    );
  }, [editing]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[440px] max-h-[70vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {editing ? 'Editar umbral' : 'Agregar umbral de stock'}
          </DialogTitle>
          <DialogDescription>
            Configura cuando recibir alertas de stock bajo para un insumo.
            Los umbrales se expresan en unidades (botellas, latas, etc.).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Drink select */}
          {!editing && (
            <div className="space-y-2">
              <Label>Insumo</Label>
              <Select
                value={drinkId ? String(drinkId) : ''}
                onValueChange={(v) => setDrinkId(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un insumo" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrinks.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name} — {d.brand} ({d.volume} ml)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {editing && (
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Insumo</Label>
              <p className="font-medium text-sm">
                {editing.drink?.name} — {editing.drink?.brand} ({editing.drink?.volume} ml)
              </p>
            </div>
          )}

          {/* Stock type selector */}
          {!editing && (
            <div className="space-y-2">
              <Label>Tipo de stock</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={sellAsWholeUnit ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setSellAsWholeUnit(true)}
                >
                  <Package className="h-3.5 w-3.5 mr-1.5" />
                  Venta directa
                </Button>
                <Button
                  type="button"
                  variant={!sellAsWholeUnit ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setSellAsWholeUnit(false)}
                >
                  <Wine className="h-3.5 w-3.5 mr-1.5" />
                  Para recetas
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Las alarmas son independientes para cada tipo de stock. Un mismo
                insumo puede tener un umbral para venta directa y otro para recetas.
              </p>
              {isDuplicate && (
                <p className="text-xs text-destructive font-medium">
                  Ya existe un umbral para este insumo como {stockTypeLabel(sellAsWholeUnit).toLowerCase()}.
                </p>
              )}
            </div>
          )}

          {editing && (
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Tipo de stock</Label>
              <div>{stockTypeBadge(editing.sellAsWholeUnit)}</div>
            </div>
          )}

          {/* Lower threshold (units) */}
          <div className="space-y-2">
            <Label>Umbral minimo (unidades)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Ej: 3"
              value={lowerThreshold}
              onChange={(e) => setLowerThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cuando el stock de este insumo en una barra baje de esta cantidad de
              unidades, se dispara una alerta de stock bajo.
            </p>
          </div>

          {/* Donation threshold (units) */}
          <div className="space-y-2">
            <Label>Umbral de donacion (unidades)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Ej: 8"
              value={donationThreshold}
              onChange={(e) => setDonationThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Barras con mas unidades que este umbral se sugieren como
              donadoras cuando se dispare una alerta.
            </p>
          </div>

          {/* Depletion horizon */}
          <div className="space-y-2">
            <Label>
              Horizonte de agotamiento (minutos){' '}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              type="number"
              min={1}
              placeholder="Ej: 30"
              value={depletionHorizon}
              onChange={(e) => setDepletionHorizon(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Si se proyecta que el stock se agotara en menos de estos minutos,
              se genera una alerta de agotamiento proyectado.
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isDuplicate}>
            {isSaving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear umbral'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Donor Suggestions ──

function DonorSuggestionsList({
  donors,
  drinkName,
  onTransfer,
}: {
  donors: DonorSuggestion[];
  drinkName: string;
  onTransfer?: (donor: DonorSuggestion) => void;
}) {
  if (!donors || donors.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2 text-muted-foreground text-xs">
        <Info className="h-3.5 w-3.5" />
        No hay barras con excedente disponible para {drinkName}.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        Barras con excedente disponible:
      </p>
      {donors.map((d) => (
        <div
          key={d.barId}
          className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2"
        >
          <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{d.barName}</p>
            <p className="text-xs text-muted-foreground">
              Excedente: {d.availableSurplus} un. &middot; Sugerido transferir:{' '}
              {d.suggestedQuantity} un.
            </p>
          </div>
          {onTransfer && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => onTransfer(d)}
            >
              <Send className="h-3 w-3 mr-1" />
              Redistribuir
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──

export function EventAlarmsTab({ eventId, isActive }: EventAlarmsTabProps) {
  // Threshold state
  const { data: thresholds = [], isLoading: thresholdsLoading } =
    useThresholds(eventId);
  const deleteMutation = useDeleteThreshold(eventId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] =
    useState<StockThreshold | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    drinkId: number;
    sellAsWholeUnit: boolean;
  } | null>(null);

  // Alerts state
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts(eventId);
  const ackMutation = useAcknowledgeAlert(eventId);
  const forceCheckMutation = useForceCheck(eventId);
  const [expandedAlertId, setExpandedAlertId] = useState<number | null>(null);
  const [alertFilter, setAlertFilter] = useState<AlertStatus | 'all'>('all');

  // Transfer dialog state
  const [transferDialog, setTransferDialog] = useState<{
    alertId: number;
    eventId: number;
    receiverBarId: number;
    receiverBarName: string;
    donorBarId: number;
    donorBarName: string;
    drinkId: number;
    drinkName: string;
    drinkVolume: number; // ml per unit for conversion
    suggestedQuantity: number; // in units
  } | null>(null);
  const [transferQty, setTransferQty] = useState(0);
  const [transferPending, setTransferPending] = useState(false);

  // Assign from inventory dialog state
  const [assignDialog, setAssignDialog] = useState<{
    eventId: number;
    barId: number;
    barName: string;
    drinkId: number;
    drinkName: string;
    sellAsWholeUnit: boolean;
    neededQuantity: number;
  } | null>(null);

  // Bars and drinks for dropdowns
  const { data: bars = [] } = useBars(eventId);

  // Collect unique drinks from all bars' stock
  const availableDrinks = useMemo(() => {
    const drinkMap = new Map<number, Drink>();
    bars.forEach((bar) => {
      (bar.stocks || []).forEach((s: any) => {
        if (s.drink && !drinkMap.has(s.drink.id)) {
          drinkMap.set(s.drink.id, s.drink);
        }
      });
    });
    return Array.from(drinkMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [bars]);

  // Existing threshold keys for duplicate detection
  const existingKeys = useMemo(
    () =>
      new Set(thresholds.map((t) => `${t.drinkId}-${t.sellAsWholeUnit}`)),
    [thresholds],
  );

  const filteredAlerts = useMemo(
    () =>
      alertFilter === 'all'
        ? alerts
        : alerts.filter((a) => a.status === alertFilter),
    [alerts, alertFilter],
  );

  const activeAlertCount = useMemo(
    () => alerts.filter((a) => a.status === 'active').length,
    [alerts],
  );

  // Handlers
  const handleEdit = (t: StockThreshold) => {
    setEditingThreshold(t);
    setFormOpen(true);
  };

  const handleDelete = (drinkId: number, sellAsWholeUnit: boolean) => {
    deleteMutation.mutate(
      { drinkId, sellAsWholeUnit },
      { onSuccess: () => setDeleteConfirm(null) },
    );
  };

  const handleAcknowledge = (alertId: number) => {
    ackMutation.mutate(alertId);
  };

  const [thresholdsOpen, setThresholdsOpen] = useState(!isActive);

  return (
    <div className="space-y-6">
      {/* ── Section 1: Active Alerts (on top, most important) ── */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas
              {activeAlertCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-red-300 text-red-700 dark:text-red-400"
                >
                  {activeAlertCount} activa{activeAlertCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              <Select
                value={alertFilter}
                onValueChange={(v) =>
                  setAlertFilter(v as AlertStatus | 'all')
                }
              >
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="acknowledged">Reconocidas</SelectItem>
                  <SelectItem value="resolved">Resueltas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => forceCheckMutation.mutate()}
                disabled={forceCheckMutation.isPending}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1 ${forceCheckMutation.isPending ? 'animate-spin' : ''}`}
                />
                Verificar ahora
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {alertFilter !== 'all'
                  ? 'No hay alertas con este filtro.'
                  : 'Sin alertas — todos los stocks están dentro de los umbrales configurados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((alert) => {
                const isExpanded = expandedAlertId === alert.id;
                return (
                  <div
                    key={alert.id}
                    className={`rounded-lg border transition-colors ${
                      alert.status === 'active'
                        ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                        : alert.status === 'acknowledged'
                          ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'
                          : ''
                    }`}
                  >
                    {/* Alert header row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <AlertTriangle
                        className={`h-4 w-4 shrink-0 ${
                          alert.status === 'active'
                            ? 'text-red-500'
                            : alert.status === 'acknowledged'
                              ? 'text-blue-500'
                              : 'text-muted-foreground'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        {/* Use the backend-generated message if available */}
                        {alert.message ? (
                          <p className="text-sm font-medium">
                            {alert.message}
                          </p>
                        ) : (
                          <p className="text-sm font-medium">
                            {alert.drink?.name || `Drink #${alert.drinkId}`}
                            {' — '}
                            {stockTypeLabel(alert.sellAsWholeUnit)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {stockTypeBadge(alert.sellAsWholeUnit)}
                          {alertTypeBadge(alert.type)}
                          {alertStatusBadge(alert.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {alert.bar?.name || `Barra #${alert.barId}`}
                          {' '}&middot;{' '}
                          Stock actual: {alert.currentStock} un.
                          {' '}&middot;{' '}
                          Umbral: {alert.threshold} un.
                          {alert.projectedMinutes != null && (
                            <>
                              {' '}&middot;{' '}
                              Agotamiento en ~{alert.projectedMinutes} min
                            </>
                          )}
                          {' '}&middot;{' '}
                          {timeAgo(alert.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {alert.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={ackMutation.isPending}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Reconocer
                          </Button>
                        )}
                        {(alert.status === 'active' || alert.status === 'acknowledged') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              setExpandedAlertId(
                                isExpanded ? null : alert.id,
                              )
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
                    </div>

                    {/* Donor suggestions + actions (expanded) */}
                    {isExpanded && (
                      <div className="px-4 pb-3 border-t pt-3 space-y-2">
                        <DonorSuggestionsList
                          donors={alert.suggestedDonors || []}
                          drinkName={alert.drink?.name || 'este insumo'}
                          onTransfer={(donor) =>
                            setTransferDialog({
                              alertId: alert.id,
                              eventId: alert.eventId,
                              receiverBarId: alert.barId,
                              receiverBarName: alert.bar?.name || `Barra #${alert.barId}`,
                              donorBarId: donor.barId,
                              donorBarName: donor.barName,
                              drinkId: alert.drinkId,
                              drinkName: alert.drink?.name || 'Insumo',
                              drinkVolume: alert.drink?.volume || 1,
                              suggestedQuantity: donor.suggestedQuantity,
                            })
                          }
                        />
                        {alert.externalNeeded && (
                          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-3 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                              <Warehouse className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                No hay suficiente excedente en otras barras.
                                Podés asignar más stock desde el inventario general.
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400"
                              onClick={() =>
                                setAssignDialog({
                                  eventId: alert.eventId,
                                  barId: alert.barId,
                                  barName: alert.bar?.name || `Barra #${alert.barId}`,
                                  drinkId: alert.drinkId,
                                  drinkName: alert.drink?.name || 'Insumo',
                                  sellAsWholeUnit: alert.sellAsWholeUnit,
                                  neededQuantity: alert.threshold - alert.currentStock,
                                })
                              }
                            >
                              <Warehouse className="h-3 w-3 mr-1" />
                              Asignar desde inventario
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Threshold Configuration (collapsible) ── */}
      <Collapsible open={thresholdsOpen} onOpenChange={setThresholdsOpen}>
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left group">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Umbrales de stock
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {thresholds.length}
                    </Badge>
                  </CardTitle>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${thresholdsOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </CollapsibleTrigger>
              {!isActive && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingThreshold(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar umbral
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Configura umbrales individuales por insumo y tipo de stock (venta
              directa o recetas). Las alertas se disparan por separado para cada
              pool.
              {isActive && (
                <span className="text-amber-600 dark:text-amber-400 ml-1">
                  Los umbrales no se pueden modificar durante un evento activo.
                </span>
              )}
            </p>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {thresholdsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : thresholds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Bell className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Sin umbrales configurados</p>
                  <p className="text-xs mt-1 text-center max-w-sm">
                    Agrega umbrales de stock para recibir alertas automaticas
                    cuando un insumo este por agotarse en una barra.
                  </p>
                  {!isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setEditingThreshold(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar primer umbral
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Min. (un.)</TableHead>
                        <TableHead className="text-right">Donacion (un.)</TableHead>
                        <TableHead className="text-right">Horizonte</TableHead>
                        {!isActive && (
                          <TableHead className="text-right w-[100px]">
                            Acciones
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {thresholds.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {t.drink?.name || `Drink #${t.drinkId}`}
                              </p>
                              {t.drink && (
                                <p className="text-xs text-muted-foreground">
                                  {t.drink.brand} &middot; {t.drink.volume} ml
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{stockTypeBadge(t.sellAsWholeUnit)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {t.lowerThreshold}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {t.donationThreshold}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {t.depletionHorizonMin
                              ? `${t.depletionHorizonMin} min`
                              : '—'}
                          </TableCell>
                          {!isActive && (
                            <TableCell className="text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEdit(t)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      drinkId: t.drinkId,
                                      sellAsWholeUnit: t.sellAsWholeUnit,
                                    })
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Threshold Form Dialog ── */}
      <ThresholdFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        eventId={eventId}
        editing={editingThreshold}
        existingKeys={existingKeys}
        availableDrinks={availableDrinks}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(v) => !v && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Eliminar umbral</DialogTitle>
            <DialogDescription>
              Estas seguro de que queres eliminar este umbral? Las alertas
              existentes no se borraran.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirm &&
                handleDelete(deleteConfirm.drinkId, deleteConfirm.sellAsWholeUnit)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Transfer (Redistribuir) Dialog ── */}
      <Dialog
        open={transferDialog !== null}
        onOpenChange={(v) => {
          if (!v) {
            setTransferDialog(null);
            setTransferQty(0);
          }
        }}
      >
        {transferDialog && (
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Redistribuir stock</DialogTitle>
              <DialogDescription>
                Transferir {transferDialog.drinkName} desde{' '}
                <strong>{transferDialog.donorBarName}</strong> hacia{' '}
                <strong>{transferDialog.receiverBarName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>Cantidad a transferir (unidades)</Label>
                <Input
                  type="number"
                  min={1}
                  max={transferDialog.suggestedQuantity * 2}
                  value={transferQty || transferDialog.suggestedQuantity}
                  onChange={(e) =>
                    setTransferQty(parseInt(e.target.value, 10) || 0)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Sugerido: {transferDialog.suggestedQuantity} un.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setTransferDialog(null);
                  setTransferQty(0);
                }}
              >
                Cancelar
              </Button>
              <Button
                disabled={transferPending || (transferQty || transferDialog.suggestedQuantity) <= 0}
                onClick={async () => {
                  setTransferPending(true);
                  try {
                    const qtyUnits = transferQty || transferDialog.suggestedQuantity;
                    // Convert units to ml for the transfer API
                    const qtyMl = qtyUnits * transferDialog.drinkVolume;
                    await transfersApi.createAndComplete(transferDialog.eventId, {
                      donorBarId: transferDialog.donorBarId,
                      receiverBarId: transferDialog.receiverBarId,
                      drinkId: transferDialog.drinkId,
                      quantity: qtyMl,
                      alertId: transferDialog.alertId,
                      notes: `Redistribución automática desde alerta de stock bajo`,
                    });
                    toast.success(
                      `Se transfirieron ${qtyUnits} un. de ${transferDialog.drinkName} desde ${transferDialog.donorBarName}`,
                    );
                    setTransferDialog(null);
                    setTransferQty(0);
                  } catch (err: any) {
                    toast.error(
                      err?.response?.data?.message || 'Error al realizar la transferencia',
                    );
                  } finally {
                    setTransferPending(false);
                  }
                }}
              >
                {transferPending ? 'Transfiriendo...' : 'Confirmar transferencia'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Assign from Inventory Info Dialog ── */}
      <Dialog
        open={assignDialog !== null}
        onOpenChange={(v) => !v && setAssignDialog(null)}
      >
        {assignDialog && (
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Asignar stock desde inventario</DialogTitle>
              <DialogDescription>
                Para asignar más {assignDialog.drinkName} a{' '}
                <strong>{assignDialog.barName}</strong>, ingresá al inventario
                general y asigná stock a esta barra.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Insumo:</span>{' '}
                  {assignDialog.drinkName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Barra destino:</span>{' '}
                  {assignDialog.barName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Tipo:</span>{' '}
                  {assignDialog.sellAsWholeUnit ? 'Venta directa' : 'Recetas'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Cantidad sugerida:</span>{' '}
                  {Math.max(assignDialog.neededQuantity, 1)} un.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Dirigite a Inventario General &gt; {assignDialog.drinkName} &gt;
                Asignar a barra para completar esta accion.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setAssignDialog(null)}>Entendido</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
