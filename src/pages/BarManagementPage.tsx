import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBar } from '@/hooks/useBars';
import { useEvent } from '@/hooks/useEvents';
import { StockTab } from '@/components/bars/StockTab';
import { EventRecipesTab } from '@/components/events/EventRecipesTab';
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
import { Trash2, ArrowLeft, Wine, Monitor, Package, Info, ArrowRight, Pencil, Beaker, ShoppingBag, Power, PowerOff, AlertTriangle, Plus } from 'lucide-react';
import { useDeleteBar, useUpdateBar } from '@/hooks/useBars';
import { useEventRecipes } from '@/hooks/useRecipes';
import { BarFormDialog } from '@/components/bars/BarFormDialog';

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
  const updateBar = useUpdateBar(eventIdNum, barIdNum);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isActive = event?.status === 'active';
  const isBarOpen = bar?.status === 'open' || bar?.status === 'lowStock';

  const { data: eventRecipes = [] } = useEventRecipes(eventIdNum);

  const isLoading = isLoadingEvent || isLoadingBar;
  const isFinished = event?.status === 'finished' || event?.status === 'archived';

  // Compute recipe ingredient warnings for this bar's type
  const recipeWarnings = useMemo(() => {
    if (!bar || !eventRecipes.length) return [];
    const warnings: Array<{ recipeName: string; missingDrinks: string[] }> = [];
    const barStocks = bar.stocks || [];

    for (const recipe of eventRecipes) {
      const isDirectSale = recipe.components.length === 1 && recipe.components[0].percentage === 100;
      if (isDirectSale) continue;
      if (!recipe.barTypes.includes(bar.type as any)) continue;

      const missingDrinks: string[] = [];
      for (const comp of recipe.components) {
        const drinkName = comp.drink?.name;
        if (!drinkName) continue;
        const hasIngredient = barStocks.some(
          (s) => !s.sellAsWholeUnit && s.drinkId === comp.drinkId && s.quantity > 0,
        );
        if (!hasIngredient) {
          missingDrinks.push(drinkName);
        }
      }
      if (missingDrinks.length > 0) {
        warnings.push({ recipeName: recipe.cocktailName, missingDrinks });
      }
    }
    return warnings;
  }, [bar, eventRecipes]);

  // Stock overview computations
  const stockOverview = useMemo(() => {
    const stocks = bar?.stocks || [];
    const directSale = stocks.filter((s) => s.sellAsWholeUnit);
    const forRecipes = stocks.filter((s) => !s.sellAsWholeUnit);

    // Compute unit counts (quantity is in ml, divide by drink volume)
    const directSaleItems = directSale.map((s) => ({
      name: s.drink?.name || 'Desconocido',
      brand: s.drink?.brand || '',
      units: s.drink?.volume ? Math.round(s.quantity / s.drink.volume) : 0,
      salePrice: s.salePrice,
    }));

    const recipeItems = forRecipes.map((s) => ({
      name: s.drink?.name || 'Desconocido',
      brand: s.drink?.brand || '',
      units: s.drink?.volume ? Math.round(s.quantity / s.drink.volume) : 0,
      volumeMl: s.quantity,
    }));

    return {
      totalItems: stocks.length,
      directSaleCount: directSale.length,
      recipeCount: forRecipes.length,
      directSaleItems,
      recipeItems,
    };
  }, [bar?.stocks]);

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
            {isActive && (
              <Button
                variant={isBarOpen ? 'outline' : 'default'}
                size="sm"
                className="gap-2"
                onClick={() =>
                  updateBar.mutate({ status: isBarOpen ? 'closed' : 'open' })
                }
                disabled={updateBar.isPending}
              >
                {isBarOpen ? (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Cerrar barra
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" />
                    Abrir barra
                  </>
                )}
              </Button>
            )}
            {event?.status === 'upcoming' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar barra
                </Button>
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
              </>
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
              <>
                {/* Summary cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5">
                          <Wine className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tipo</p>
                          <p className="text-lg font-semibold capitalize">{bar?.type}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-500/10 p-2.5">
                          <Monitor className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Dispositivos POS</p>
                          <p className="text-lg font-semibold">{bar?.posnets?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-green-500/10 p-2.5">
                          <ShoppingBag className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Venta directa</p>
                          <p className="text-lg font-semibold">{stockOverview.directSaleCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-indigo-500/10 p-2.5">
                          <Beaker className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Para recetas</p>
                          <p className="text-lg font-semibold">{stockOverview.recipeCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recipe ingredient warnings – always shown */}
                {recipeWarnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-amber-800">
                          Insumos faltantes para recetas
                        </p>
                        <p className="text-xs text-amber-700">
                          Esta barra tiene recetas asignadas (por ser tipo <strong className="capitalize">{bar?.type}</strong>) que requieren insumos que aún no están cargados. Cargá el stock faltante antes de activar el evento.
                        </p>
                        <ul className="text-xs text-amber-700 space-y-1 pt-1">
                          {recipeWarnings.map((w) => (
                            <li key={w.recipeName} className="flex items-start gap-1.5">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>
                                <span className="font-semibold">{w.recipeName}</span>
                                {' — necesita: '}
                                {w.missingDrinks.map((d, i) => (
                                  <span key={d}>
                                    {i > 0 && ', '}
                                    <span className="font-medium">{d}</span>
                                  </span>
                                ))}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-800 border-amber-300 hover:bg-amber-100 mt-1"
                          onClick={() => setActiveTab('stock')}
                        >
                          Ir a cargar stock
                          <ArrowRight className="ml-1.5 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stock detail lists */}
                {stockOverview.totalItems === 0 ? (
                  <Card className="rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No hay stock cargado en esta barra
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        Asigná stock desde el inventario global para empezar.
                      </p>
                      <Button
                        variant="default"
                        className="gap-2"
                        onClick={() => setActiveTab('stock')}
                      >
                        <Plus className="h-4 w-4" />
                        Cargar stock a esta barra
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Direct sale items */}
                    <Card className="rounded-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <ShoppingBag className="h-4 w-4 text-green-600" />
                          <h3 className="text-sm font-semibold">Venta directa</h3>
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {stockOverview.directSaleCount}
                          </Badge>
                        </div>
                        {stockOverview.directSaleItems.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">Sin productos de venta directa</p>
                        ) : (
                          <div className="space-y-2">
                            {stockOverview.directSaleItems.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm rounded-lg bg-muted/40 px-3 py-2"
                              >
                                <div>
                                  <p className="font-medium text-sm">{item.name}</p>
                                  {item.brand && (
                                    <p className="text-xs text-muted-foreground">{item.brand}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-medium">{item.units} u.</p>
                                  {item.salePrice != null && item.salePrice > 0 && (
                                    <p className="text-xs text-green-600 font-medium">
                                      ${(item.salePrice / 100).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recipe ingredients */}
                    <Card className="rounded-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Beaker className="h-4 w-4 text-indigo-600" />
                          <h3 className="text-sm font-semibold">Para recetas</h3>
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {stockOverview.recipeCount}
                          </Badge>
                        </div>
                        {stockOverview.recipeItems.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">Sin insumos para recetas</p>
                        ) : (
                          <div className="space-y-2">
                            {stockOverview.recipeItems.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm rounded-lg bg-muted/40 px-3 py-2"
                              >
                                <div>
                                  <p className="font-medium text-sm">{item.name}</p>
                                  {item.brand && (
                                    <p className="text-xs text-muted-foreground">{item.brand}</p>
                                  )}
                                </div>
                                <p className="text-xs font-medium">{item.units} u.</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            {recipeWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-amber-800">
                      Insumos faltantes para recetas asignadas a esta barra
                    </p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Las siguientes recetas están configuradas para barras de tipo <strong className="capitalize">{bar?.type}</strong> pero necesitan insumos que aún no cargaste en esta barra.
                    </p>
                    <ul className="text-xs text-amber-700 space-y-1 pt-1">
                      {recipeWarnings.map((w) => (
                        <li key={w.recipeName} className="flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>
                            <span className="font-semibold">{w.recipeName}</span>
                            {' — necesita: '}
                            {w.missingDrinks.map((d, i) => (
                              <span key={d}>
                                {i > 0 && ', '}
                                <span className="font-medium">{d}</span>
                              </span>
                            ))}
                            <span className="text-amber-500"> (para recetas)</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <StockTab eventId={eventIdNum} barId={barIdNum} />
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4">
            <EventRecipesTab
              eventId={eventIdNum}
              isEditable={event?.status === 'upcoming'}
              showWarnings={false}
              onNavigateToBarras={() => setActiveTab('stock')}
            />
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

      {bar && (
        <BarFormDialog
          eventId={eventIdNum}
          bar={bar}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
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
