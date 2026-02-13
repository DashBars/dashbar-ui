import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBar } from '@/hooks/useBars';
import { useEvent } from '@/hooks/useEvents';
import { StockTab } from '@/components/bars/StockTab';
import { RecipeOverridesTab } from '@/components/bars/RecipeOverridesTab';
import { PosnetsTab } from '@/components/bars/PosnetsTab';
import type { BarStatus, BarType } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, ArrowLeft, Wine, Monitor, Package, Info, ArrowRight } from 'lucide-react';
import { useDeleteBar } from '@/hooks/useBars';

const barTypeColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  VIP: 'default',
  general: 'secondary',
  backstage: 'outline',
  lounge: 'secondary',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  open: 'default',
  closed: 'secondary',
  lowStock: 'destructive',
};

type TabKey = 'overview' | 'stock' | 'recipes' | 'pos';

export function BarManagementPage() {
  const { eventId, barId } = useParams<{ eventId: string; barId: string }>();
  const eventIdNum = parseInt(eventId || '0', 10);
  const barIdNum = parseInt(barId || '0', 10);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedTab = (searchParams.get('tab') as TabKey | null) || 'overview';
  const [activeTab, setActiveTab] = useState<TabKey>(requestedTab);

  const { data: event, isLoading: isLoadingEvent } = useEvent(eventIdNum);
  const { data: bar, isLoading: isLoadingBar } = useBar(eventIdNum, barIdNum);
  const deleteBar = useDeleteBar(eventIdNum);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isLoading = isLoadingEvent || isLoadingBar;
  const isFinished = event?.status === 'finished' || event?.status === 'archived';

  // Mantener el estado sincronizado con la URL sin setState durante el render
  useEffect(() => {
    const validTabs: TabKey[] = ['overview', 'stock', 'recipes', 'pos'];
    const next = validTabs.includes(requestedTab as TabKey) ? (requestedTab as TabKey) : 'overview';
    setActiveTab(next);
  }, [requestedTab]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => navigate(`/events/${eventIdNum}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
            <nav className="text-sm text-muted-foreground" aria-label="Navegación">
              <Link to="/events" className="hover:text-foreground transition-colors">
                Eventos
              </Link>
              <span className="mx-2">/</span>
              <Link
                to={`/events/${eventIdNum}`}
                className="hover:text-foreground transition-colors"
              >
                {event?.name || `Evento ${eventIdNum}`}
              </Link>
              <span className="mx-2">/</span>
              <Link
                to={`/events/${eventIdNum}`}
                className="hover:text-foreground transition-colors"
              >
                Barras
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">
                {bar?.name || `Barra ${barIdNum}`}
              </span>
            </nav>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {isLoading ? <Skeleton className="h-9 w-64" /> : bar?.name}
          </h1>
          {!isFinished && (
            <p className="text-muted-foreground mt-1">
              Gestioná configuración, stock, recetas y POS de la barra
            </p>
          )}
        </div>

        {!isLoading && bar && (
          <div className="flex items-center gap-3">
            <Badge variant={barTypeColors[bar.type as BarType] || 'default'}>
              {bar.type}
            </Badge>
            <Badge variant={statusColors[bar.status as BarStatus] || 'default'}>
              {bar.status}
            </Badge>
            {event?.status === 'upcoming' && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteBar.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar barra
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Finished/Archived: read-only summary with redirect banner */}
      {isFinished ? (
        <div className="space-y-4">
          {/* Redirect banner */}
          <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-200">Evento finalizado</p>
                <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                  El stock remanente, reportes y devoluciones se gestionan desde el Resumen del evento.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0 ml-4"
              onClick={() => navigate(`/events/${eventIdNum}`)}
            >
              Ir al evento
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Read-only bar summary */}
          <Card className="rounded-2xl">
            <CardContent className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2.5">
                  <Wine className="h-4.5 w-4.5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-none">Tipo</p>
                    <p className="text-sm font-semibold capitalize leading-tight">{bar?.type}</p>
                  </div>
                </div>

                <div className="h-8 w-px bg-border" />

                <div className="flex items-center gap-2.5">
                  <Monitor className="h-4.5 w-4.5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-none">Terminales POS</p>
                    <p className="text-sm font-semibold leading-tight">{bar?.posnets?.length || 0}</p>
                  </div>
                </div>

                <div className="h-8 w-px bg-border" />

                <div className="flex items-center gap-2.5">
                  <Package className="h-4.5 w-4.5 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-none">Insumos en stock</p>
                    <p className="text-sm font-semibold leading-tight">{bar?.stocks?.length || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Active/Upcoming: full management tabs */
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            const tab = v as TabKey;
            setActiveTab(tab);
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', tab);
              return next;
            });
          }}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="stock">Inventario</TabsTrigger>
            <TabsTrigger value="recipes">Recetas</TabsTrigger>
            <TabsTrigger value="pos">POS</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-primary/10 p-3">
                        <Wine className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de barra</p>
                        <p className="text-2xl font-semibold capitalize">{bar?.type}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-blue-500/10 p-3">
                        <Monitor className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dispositivos POS</p>
                        <p className="text-2xl font-semibold">{bar?.posnets?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-green-500/10 p-3">
                        <Package className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Insumos en stock</p>
                        <p className="text-2xl font-semibold">{bar?.stocks?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <StockTab eventId={eventIdNum} barId={barIdNum} />
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4">
            <RecipeOverridesTab eventId={eventIdNum} barId={barIdNum} barType={bar?.type as BarType | undefined} />
          </TabsContent>

          <TabsContent value="pos" className="space-y-4">
            <PosnetsTab
              posnets={bar?.posnets || []}
              eventId={eventIdNum}
              barId={barIdNum}
              isLoading={isLoadingBar}
            />
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar barra</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar esta barra? Esta acción no se puede deshacer.
              <br />
              <span className="font-medium">
                El stock de la barra se devuelve automáticamente al inventario general.
              </span>
              <br />
              Solo es posible eliminar barras cuando el evento está en estado <span className="font-medium">upcoming</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteBar.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteBar.mutate(barIdNum, {
                  onSuccess: () => {
                    setDeleteDialogOpen(false);
                    navigate(`/events/${eventIdNum}`);
                  },
                });
              }}
              disabled={deleteBar.isPending}
            >
              {deleteBar.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
