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
import { Trash2, ArrowLeft, Wine, Monitor, Package } from 'lucide-react';
import { useDeleteBar } from '@/hooks/useBars';
import { BarMovementsTab } from '@/components/bars/BarMovementsTab';

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

type TabKey = 'overview' | 'stock' | 'recipes' | 'pos' | 'movements';

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

  // Mantener el estado sincronizado con la URL sin setState durante el render
  useEffect(() => {
    const next =
      requestedTab === 'overview' ||
      requestedTab === 'stock' ||
      requestedTab === 'recipes' ||
      requestedTab === 'pos'
        ? requestedTab
        : 'overview';
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
            <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link to="/events" className="hover:text-foreground transition-colors">
                Events
              </Link>
              <span className="mx-2">/</span>
              <Link
                to={`/events/${eventIdNum}`}
                className="hover:text-foreground transition-colors"
              >
                {event?.name || `Event ${eventIdNum}`}
              </Link>
              <span className="mx-2">/</span>
              <Link
                to={`/events/${eventIdNum}`}
                className="hover:text-foreground transition-colors"
              >
                Bars
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">
                {bar?.name || `Bar ${barIdNum}`}
              </span>
            </nav>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {isLoading ? <Skeleton className="h-9 w-64" /> : bar?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestioná configuración, stock, recetas y POS de la barra
          </p>
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="recipes">Recetas</TabsTrigger>
          <TabsTrigger value="pos">POS</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
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
                      <p className="text-sm text-muted-foreground">Items en stock</p>
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
          <RecipeOverridesTab eventId={eventIdNum} barId={barIdNum} />
        </TabsContent>

        <TabsContent value="pos" className="space-y-4">
          <PosnetsTab
            posnets={bar?.posnets || []}
            eventId={eventIdNum}
            barId={barIdNum}
            isLoading={isLoadingBar}
          />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <BarMovementsTab eventId={eventIdNum} barId={barIdNum} />
        </TabsContent>
      </Tabs>

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

