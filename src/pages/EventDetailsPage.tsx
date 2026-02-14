import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEvent, useDeleteEvent, useArchiveEvent } from '@/hooks/useEvents';
import { ActivateEventDialog } from '@/components/events/ActivateEventDialog';
import { FinishEventButton } from '@/components/events/FinishEventButton';
import { BarsPageHeader } from '@/components/bars/BarsPageHeader';
import { BarsSummaryCards } from '@/components/bars/BarsSummaryCards';
import { BarsFilters } from '@/components/bars/BarsFilters';
import { BarsTable } from '@/components/bars/BarsTable';
import { BarFormDialog } from '@/components/bars/BarFormDialog';
import { useBars } from '@/hooks/useBars';
import type { Event as ApiEvent, EventStatus, Bar, BarType, BarStatus } from '@/lib/api/types';
import { ChevronRight, Calendar, MapPin, Trash2, Play, Cog, Pencil, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useEventRecipes } from '@/hooks/useRecipes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EventRecipesTab } from '@/components/events/EventRecipesTab';
import { EventMonitoringTab } from '@/components/events/EventMonitoringTab';
import { PosManagementTab } from '@/components/pos';
import { EventReportTab } from '@/components/reports';
import { BarPostEventOverview } from '@/components/bars/BarPostEventOverview';
import { AssignStockWizard } from '@/components/bars/AssignStockWizard';

// Use persisted status from backend (source of truth)
function getEventStatus(event: ApiEvent): EventStatus {
  return event.status || 'upcoming'; // Fallback to upcoming if status is missing
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'No definido';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Fecha inválida';
  }
}

function StatusBadge({ status }: { status: EventStatus }) {
  const variants = {
    upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    finished: 'bg-gray-100 text-gray-800 border-gray-200',
    archived: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <Badge variant="outline" className={variants[status] || variants.upcoming}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const eventIdNum = parseInt(eventId || '0', 10);
  const { data: event, isLoading } = useEvent(eventIdNum);
  const { mutate: deleteEvent } = useDeleteEvent();
  const { mutate: archiveEvent } = useArchiveEvent();

  const status = event ? getEventStatus(event) : 'upcoming';
  const isFinished = status === 'finished' || status === 'archived';

  const location = useLocation();
  // Support deep-linking to a specific tab via location.state.tab
  const stateTab = (location.state as { tab?: string } | null)?.tab;
  const isActive = status === 'active';
  // Default tab: "monitoring" for active events, "overview" for finished, "bars" for upcoming
  const defaultTab = stateTab || (isActive ? 'monitoring' : isFinished ? 'overview' : 'bars');
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  
  // Bars state
  const { data: bars, isLoading: isLoadingBars } = useBars(eventIdNum);
  const { data: eventRecipes = [] } = useEventRecipes(eventIdNum);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BarType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<BarStatus | 'all'>('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [stockWizardOpen, setStockWizardOpen] = useState(false);

  // Compute recipe ingredient warnings PER BAR at the event level
  // Each bar of a given type is checked individually
  const eventRecipeWarnings = useMemo(() => {
    if (!bars || !eventRecipes.length) return [];
    const warnings: Array<{ recipeName: string; barType: string; barId: number; barName: string; missingDrinks: string[] }> = [];

    for (const recipe of eventRecipes) {
      const isDirectSale = recipe.components.length === 1 && recipe.components[0].percentage === 100;
      if (isDirectSale) continue;

      for (const barType of recipe.barTypes) {
        // Check EVERY bar of this type individually
        const typeBars = bars.filter((b) => b.type === barType);

        for (const bar of typeBars) {
          const missingDrinks: string[] = [];
          for (const comp of recipe.components) {
            const hasIngredient = (bar.stocks || []).some(
              (s) => !s.sellAsWholeUnit && s.drinkId === comp.drinkId && s.quantity > 0,
            );
            if (!hasIngredient && comp.drink?.name) {
              missingDrinks.push(comp.drink.name);
            }
          }
          if (missingDrinks.length > 0) {
            warnings.push({
              recipeName: recipe.cocktailName,
              barType,
              barId: bar.id,
              barName: bar.name,
              missingDrinks,
            });
          }
        }
      }
    }
    return warnings;
  }, [bars, eventRecipes]);

  const filteredBars = useMemo(() => {
    if (!bars) return [];
    return bars.filter((bar) => {
      const matchesSearch =
        bar.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || bar.type === typeFilter;
      
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'lowStock') {
          matchesStatus = bar.status === 'lowStock';
        } else if (statusFilter === 'open') {
          matchesStatus = bar.status === 'open' || bar.status === 'lowStock';
        } else {
          matchesStatus = bar.status === statusFilter;
        }
      }
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [bars, search, typeFilter, statusFilter]);

  const handleCreateBar = () => {
    setEditingBar(null);
    setFormDialogOpen(true);
  };

  const handleBarClick = (bar: Bar) => {
    navigate(`/events/${eventIdNum}/bars/${bar.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-muted-foreground mb-4">
              Evento no encontrado
            </p>
            <Button onClick={() => navigate('/events')}>Volver a Eventos</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (event) {
      deleteEvent(event.id, {
        onSuccess: () => {
          navigate('/events');
        },
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Breadcrumbs with back button */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate('/events')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/events" className="hover:text-foreground">
            Eventos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{event.name}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-muted-foreground mt-1">
              {event.description || 'Sin descripción'}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          {status === 'upcoming' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Cog className="h-4 w-4" />
                  <span className="sr-only">Opciones del evento</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setActivateDialogOpen(true)}>
                  <Play className="mr-2 h-4 w-4 text-emerald-600" />
                  Activar evento
                  {eventRecipeWarnings.length > 0 && (
                    <AlertTriangle className="ml-auto h-3.5 w-3.5 text-amber-500" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // TODO: open edit dialog when implemented
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {status === 'active' && (
            <FinishEventButton event={event} />
          )}
          {status === 'finished' && (
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(true)}
            >
              Archivar
            </Button>
          )}
        </div>
      </div>

      {/* Event info bar - always visible below header */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground mb-6">
        {event.startedAt && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Inicio: <span className="text-foreground font-medium">{formatDate(event.startedAt)}</span>
          </span>
        )}
        {event.finishedAt && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Fin: <span className="text-foreground font-medium">{formatDate(event.finishedAt)}</span>
          </span>
        )}
        {event.venue && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{event.venue.name}</span>
            <span className="text-xs">({event.venue.city}, {event.venue.country})</span>
          </span>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          {/* Monitoring tab only for active events */}
          {isActive && (
            <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
          )}
          {/* Overview tab only for finished/archived */}
          {isFinished && (
            <TabsTrigger value="overview">Resumen</TabsTrigger>
          )}
          <TabsTrigger value="bars">Barras</TabsTrigger>
          <TabsTrigger value="recipes">Recetas y Productos</TabsTrigger>
          <TabsTrigger value="pos">POS</TabsTrigger>
          {isFinished && (
            <TabsTrigger value="reports">Reportes</TabsTrigger>
          )}
        </TabsList>

        {/* Monitoring - only for active events */}
        {isActive && (
          <TabsContent value="monitoring" className="space-y-4">
            <EventMonitoringTab eventId={eventIdNum} />
          </TabsContent>
        )}

        {/* Overview - only for finished/archived events */}
        {isFinished && (
          <TabsContent value="overview" className="space-y-4">
            <BarPostEventOverview eventId={eventIdNum} />
          </TabsContent>
        )}

        <TabsContent value="bars" className="space-y-4">
          <BarsPageHeader
            eventId={eventIdNum}
            eventName={event.name}
            onCreateBar={handleCreateBar}
            onLoadStock={() => setStockWizardOpen(true)}
            isEditable={status === 'upcoming'}
            hasBars={(bars || []).length > 0}
            recipeWarnings={eventRecipeWarnings}
          />
          <BarsSummaryCards bars={bars || []} isLoading={isLoadingBars} />
          <BarsFilters
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
          <BarsTable
            bars={filteredBars}
            isLoading={isLoadingBars}
            onViewDetails={handleBarClick}
            recipeWarnings={eventRecipeWarnings}
          />
        </TabsContent>

        <TabsContent value="recipes" className="space-y-4">
          <EventRecipesTab
            eventId={eventIdNum}
            isEditable={status === 'upcoming'}
            onNavigateToBarras={() => setActiveTab('bars')}
          />
        </TabsContent>

        <TabsContent value="pos" className="space-y-4">
          <PosManagementTab eventId={eventIdNum} />
        </TabsContent>

        {isFinished && (
          <TabsContent value="reports" className="space-y-4">
            <EventReportTab eventId={eventIdNum} eventName={event.name} />
          </TabsContent>
        )}
      </Tabs>

      {/* Bars Dialogs */}
      <BarFormDialog
        eventId={eventIdNum}
        bar={editingBar}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
      />

      <AssignStockWizard
        eventId={eventIdNum}
        bars={bars || []}
        open={stockWizardOpen}
        onOpenChange={setStockWizardOpen}
      />

      {event && status === 'upcoming' && (
        <ActivateEventDialog
          event={event}
          open={activateDialogOpen}
          onOpenChange={setActivateDialogOpen}
          recipeWarnings={eventRecipeWarnings}
        />
      )}

      {/* Delete Event Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Evento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar "{event?.name}"? Esta acción no se puede deshacer.
              Solo podés eliminar eventos en estado "próximo".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Event Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archivar Evento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres archivar "{event?.name}"? Solo puedes archivar eventos finalizados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (event) {
                  archiveEvent(event.id, {
                    onSuccess: () => {
                      setArchiveDialogOpen(false);
                      navigate('/events');
                    },
                  });
                }
              }}
            >
              Archivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
