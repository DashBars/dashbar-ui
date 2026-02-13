import { Button } from '@/components/ui/button';
import { Plus, PackagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BarsPageHeaderProps {
  eventId: number;
  eventName?: string;
  onCreateBar: () => void;
  onLoadStock?: () => void;
  isEditable?: boolean;
  hasBars?: boolean;
}

export function BarsPageHeader({
  eventId,
  eventName = 'Evento',
  onCreateBar,
  onLoadStock,
  isEditable = true,
  hasBars = false,
}: BarsPageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b pb-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link
              to="/events"
              className="hover:text-foreground transition-colors"
            >
              Eventos
            </Link>
            <span className="mx-2">/</span>
            <Link
              to={`/events/${eventId}`}
              className="hover:text-foreground transition-colors"
            >
              {eventName}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">Barras</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight">Barras</h1>
        </div>
        {isEditable && (
          <div className="flex gap-2">
            {hasBars && onLoadStock && (
              <Button
                onClick={onLoadStock}
                variant="outline"
                className="gap-2"
              >
                <PackagePlus className="h-4 w-4" />
                Cargar Stock a Barras
              </Button>
            )}
            <Button
              onClick={onCreateBar}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear barra
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
