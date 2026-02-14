import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableTableHead, useTableSort, sortItems } from '@/components/ui/sortable-table-head';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents, useUnarchiveEvent } from '@/hooks/useEvents';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import type { Event, EventStatus } from '@/lib/api/types';
import { Plus } from 'lucide-react';
// Use persisted status from backend (source of truth)
function getEventStatus(event: Event): EventStatus {
  return event.status || 'upcoming'; // Fallback to upcoming if status is missing
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
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
    return '-';
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

export function EventsListPage() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEvents();
  const { mutate: unarchiveEvent, isPending: isUnarchiving } = useUnarchiveEvent();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { sortKey, sortDir, handleSort } = useTableSort();
  const sortGetters: Record<string, (item: Event) => string | number | null | undefined> = {
    name: (e) => e.name?.toLowerCase(),
    venue: (e) => e.venue?.name?.toLowerCase() ?? '',
    status: (e) => getEventStatus(e)?.toLowerCase() ?? '',
    startedAt: (e) => (e.startedAt ? new Date(e.startedAt).getTime() : null),
    finishedAt: (e) => (e.finishedAt ? new Date(e.finishedAt).getTime() : null),
  };

  const searchedEvents = useMemo(() => {
    if (!search) return events;
    const lowerSearch = search.toLowerCase();
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(lowerSearch) ||
        e.description?.toLowerCase().includes(lowerSearch),
    );
  }, [events, search]);

  const activeEvents = useMemo(() => {
    let filtered = searchedEvents.filter((e) => getEventStatus(e) !== 'archived');
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => getEventStatus(e) === statusFilter);
    }
    return filtered;
  }, [searchedEvents, statusFilter]);

  const archivedEvents = useMemo(() => {
    return searchedEvents.filter((e) => getEventStatus(e) === 'archived');
  }, [searchedEvents]);

  const sortedActiveEvents = useMemo(
    () => sortItems(activeEvents, sortKey, sortDir, sortGetters),
    [activeEvents, sortKey, sortDir],
  );

  const sortedArchivedEvents = useMemo(
    () => sortItems(archivedEvents, sortKey, sortDir, sortGetters),
    [archivedEvents, sortKey, sortDir],
  );

  const handleCreate = () => {
    setEditingEvent(null);
    setFormDialogOpen(true);
  };

  const handleRowClick = (event: Event) => {
    navigate(`/events/${event.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Sede</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground mt-1">
            Gestioná tus eventos y su ciclo de vida
          </p>
        </div>
        {events.length > 0 && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Crear evento
          </Button>
        )}
      </div>

      {events.length === 0 && !isLoading ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-muted-foreground mb-4">
              Todavía no hay eventos
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Empezá creando tu primer evento. Vas a poder configurar barras, recetas y precios para cada uno.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Creá tu primer evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Eventos</TabsTrigger>
            <TabsTrigger value="archived">
              Archivados {archivedEvents.length > 0 ? `(${archivedEvents.length})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar eventos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="upcoming">Próximos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="finished">Finalizados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="rounded-2xl border shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead sortKey="name" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Nombre
                      </SortableTableHead>
                      <SortableTableHead sortKey="venue" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Sede
                      </SortableTableHead>
                      <SortableTableHead sortKey="status" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Estado
                      </SortableTableHead>
                      <SortableTableHead sortKey="startedAt" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Inicio
                      </SortableTableHead>
                      <SortableTableHead sortKey="finishedAt" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Fin
                      </SortableTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedActiveEvents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No se encontraron eventos
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedActiveEvents.map((event) => {
                        const status = getEventStatus(event);
                        return (
                          <TableRow
                            key={event.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleRowClick(event)}
                          >
                            <TableCell className="font-medium">{event.name}</TableCell>
                            <TableCell>{event.venue?.name || '-'}</TableCell>
                            <TableCell>
                              <StatusBadge status={status} />
                            </TableCell>
                            <TableCell>
                              {status === 'upcoming' && event.startedAt ? (
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground text-xs">
                                    Programado:
                                  </span>
                                  <span>{formatDate(event.startedAt)}</span>
                                </div>
                              ) : (
                                formatDate(event.startedAt)
                              )}
                            </TableCell>
                            <TableCell>{formatDate(event.finishedAt)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archived" className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar eventos archivados..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card className="rounded-2xl border shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead sortKey="name" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Nombre
                      </SortableTableHead>
                      <SortableTableHead sortKey="venue" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Sede
                      </SortableTableHead>
                      <SortableTableHead sortKey="status" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Estado
                      </SortableTableHead>
                      <SortableTableHead sortKey="startedAt" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Inicio
                      </SortableTableHead>
                      <SortableTableHead sortKey="finishedAt" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                        Fin
                      </SortableTableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedArchivedEvents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No hay eventos archivados
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedArchivedEvents.map((event) => {
                        const status = getEventStatus(event);
                        return (
                          <TableRow
                            key={event.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleRowClick(event)}
                          >
                            <TableCell className="font-medium">{event.name}</TableCell>
                            <TableCell>{event.venue?.name || '-'}</TableCell>
                            <TableCell>
                              <StatusBadge status={status} />
                            </TableCell>
                            <TableCell>{formatDate(event.startedAt)}</TableCell>
                            <TableCell>{formatDate(event.finishedAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isUnarchiving}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unarchiveEvent(event.id);
                                }}
                              >
                                Desarchivar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <EventFormDialog
        event={editingEvent}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
      />
    </div>
  );
}
