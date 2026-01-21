import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useEvent, useStartEvent, useFinishEvent, useDeleteEvent } from '@/hooks/useEvents';
import { StartEventButton } from '@/components/events/StartEventButton';
import { FinishEventButton } from '@/components/events/FinishEventButton';
import { BarsPageHeader } from '@/components/bars/BarsPageHeader';
import { BarsSummaryCards } from '@/components/bars/BarsSummaryCards';
import { BarsFilters } from '@/components/bars/BarsFilters';
import { BarsTable } from '@/components/bars/BarsTable';
import { BarFormDialog } from '@/components/bars/BarFormDialog';
import { BarDetailsSheet } from '@/components/bars/BarDetailsSheet';
import { useBars } from '@/hooks/useBars';
import type { EventStatus, Bar, BarType, BarStatus } from '@/lib/api/types';
import { ChevronRight, Calendar, MapPin, Trash2 } from 'lucide-react';

function getEventStatus(event: any): EventStatus {
  if (event.finishedAt) {
    return 'finished';
  }
  if (event.startedAt) {
    return 'active';
  }
  return 'upcoming';
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not set';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
}

function StatusBadge({ status }: { status: EventStatus }) {
  const variants = {
    upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    finished: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <Badge variant="outline" className={variants[status]}>
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
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Bars state
  const { data: bars, isLoading: isLoadingBars } = useBars(eventIdNum);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BarType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<BarStatus | 'all'>('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'overview' | 'stock' | 'recipes' | 'pos'>('overview');

  const filteredBars = useMemo(() => {
    if (!bars) return [];
    return bars.filter((bar) => {
      const matchesSearch =
        bar.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || bar.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' || bar.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [bars, search, typeFilter, statusFilter]);

  const handleCreateBar = () => {
    setEditingBar(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (bar: Bar) => {
    setEditingBar(bar);
    setFormDialogOpen(true);
  };

  const handleViewDetails = (bar: Bar, tab?: 'overview' | 'stock' | 'recipes' | 'pos') => {
    setSelectedBar(bar);
    if (tab) setInitialTab(tab);
    setDetailsSheetOpen(true);
  };

  const handleManageStock = (bar: Bar) => {
    handleViewDetails(bar, 'stock');
  };

  const handleManageRecipes = (bar: Bar) => {
    handleViewDetails(bar, 'recipes');
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
              Event not found
            </p>
            <Button onClick={() => navigate('/events')}>Back to Events</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getEventStatus(event);

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
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/events" className="hover:text-foreground">
          Events
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{event.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-muted-foreground mt-1">
              {event.description || 'No description'}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex gap-2">
          {status === 'upcoming' && (
            <StartEventButton event={event} />
          )}
          {status === 'active' && (
            <FinishEventButton event={event} />
          )}
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Event
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bars">Bars</TabsTrigger>
          {status === 'finished' && (
            <TabsTrigger value="reports">Reports</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Status
                  </div>
                  <StatusBadge status={status} />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Started At
                  </div>
                  <div className="text-base">{formatDate(event.startedAt)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Finished At
                  </div>
                  <div className="text-base">{formatDate(event.finishedAt)}</div>
                </div>
                {event.venue && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Venue
                    </div>
                    <div className="text-base">{event.venue.name}</div>
                    {event.venue.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {event.venue.description}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Metrics and analytics will be available here once the event is finished.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bars" className="space-y-4">
          <BarsPageHeader
            eventId={eventIdNum}
            eventName={event.name}
            onCreateBar={handleCreateBar}
            isEventFinished={status === 'finished'}
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
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onManageStock={handleManageStock}
            onManageRecipes={handleManageRecipes}
          />
        </TabsContent>

        {status === 'finished' && (
          <TabsContent value="reports" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Event reports and analytics will be available here.
                </div>
              </CardContent>
            </Card>
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
      {selectedBar && (
        <BarDetailsSheet
          eventId={eventIdNum}
          bar={selectedBar}
          open={detailsSheetOpen}
          onOpenChange={setDetailsSheetOpen}
          initialTab={initialTab}
        />
      )}

      {/* Delete Event Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar "{event?.name}"? Esta acción
              no se puede deshacer y se eliminarán todos los datos asociados al evento.
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
    </div>
  );
}
