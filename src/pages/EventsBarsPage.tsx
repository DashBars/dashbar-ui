import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { BarsPageHeader } from '@/components/bars/BarsPageHeader';
import { BarsSummaryCards } from '@/components/bars/BarsSummaryCards';
import { BarsFilters } from '@/components/bars/BarsFilters';
import { BarsTable } from '@/components/bars/BarsTable';
import { BarFormDialog } from '@/components/bars/BarFormDialog';
import { useBars } from '@/hooks/useBars';
import { useEvent } from '@/hooks/useEvents';
import type { Bar, BarType, BarStatus } from '@/lib/api/types';

export function EventsBarsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eventIdNum = parseInt(eventId || '0', 10);
  const navigate = useNavigate();
  const { data: bars, isLoading, error } = useBars(eventIdNum);
  const { data: event } = useEvent(eventIdNum);
  
  const isEditable = event?.status === 'upcoming';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BarType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<BarStatus | 'all'>('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);

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

  const handleViewDetails = (bar: Bar) => {
    navigate(`/events/${eventIdNum}/bars/${bar.id}`);
  };

  // Show error message if there's an error
  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Error desconocido';
    const isUnauthorized = (error as any)?.response?.status === 401;
    
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Breadcrumbs with back button */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigate(`/events/${eventIdNum}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/events" className="hover:text-foreground">
              Eventos
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/events/${eventIdNum}`} className="hover:text-foreground">
              {event?.name || `Event ${eventIdNum}`}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Barras</span>
          </div>
        </div>

        <BarsPageHeader
          eventId={eventIdNum}
          eventName={event?.name}
          onCreateBar={handleCreateBar}
          isEditable={isEditable}
        />
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            {isUnauthorized ? 'Autenticación requerida' : 'Error al cargar barras'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
          {isUnauthorized && (
            <p className="text-xs text-muted-foreground">
              Por favor, inicia sesión para acceder a esta página.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Breadcrumbs with back button */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate(`/events/${eventIdNum}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/events" className="hover:text-foreground">
            Eventos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/events/${eventIdNum}`} className="hover:text-foreground">
            {event?.name || `Evento ${eventIdNum}`}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Barras</span>
        </div>
      </div>

      <BarsPageHeader
        eventId={eventIdNum}
        eventName={event?.name}
        onCreateBar={handleCreateBar}
        isEditable={isEditable}
      />
      <BarsSummaryCards bars={bars} isLoading={isLoading} />
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
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
      />
      <BarFormDialog
        eventId={eventIdNum}
        bar={editingBar}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
      />
    </div>
  );
}
