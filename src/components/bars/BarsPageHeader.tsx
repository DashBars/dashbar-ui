import { Button } from '@/components/ui/button';
import { Plus, PackagePlus, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface RecipeWarning {
  recipeName: string;
  barType: string;
  barId: number;
  barName: string;
  missingDrinks: string[];
}

interface BarsPageHeaderProps {
  eventId: number;
  eventName?: string;
  onCreateBar: () => void;
  onLoadStock?: () => void;
  isEditable?: boolean;
  hasBars?: boolean;
  recipeWarnings?: RecipeWarning[];
}

export function BarsPageHeader({
  eventId,
  eventName = 'Evento',
  onCreateBar,
  onLoadStock,
  isEditable = true,
  hasBars = false,
  recipeWarnings = [],
}: BarsPageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-10 bg-background border-b pb-4 mb-6 space-y-3">
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
          <div className="flex items-center gap-2">
            {recipeWarnings.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600" title="Hay recetas sin insumos completos">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">{recipeWarnings.length}</span>
              </div>
            )}
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

      {/* Recipe ingredient warnings banner */}
      {recipeWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold text-amber-800">
                Insumos faltantes para recetas — no se puede activar el evento
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                Las siguientes barras tienen recetas asignadas pero les faltan ingredientes para prepararlas.
              </p>
              <ul className="text-xs text-amber-700 space-y-1 mt-1">
                {recipeWarnings.map((w) => (
                  <li key={`${w.recipeName}-${w.barId}`} className="flex items-start justify-between gap-2">
                    <span>
                      <span className="font-semibold">{w.recipeName}</span>
                      {' en '}
                      <span className="font-semibold">{w.barName}</span>
                      <span className="text-amber-600"> ({w.barType})</span>
                      {' — necesita: '}
                      {w.missingDrinks.join(', ')}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-medium whitespace-nowrap shrink-0"
                      onClick={() => navigate(`/events/${eventId}/bars/${w.barId}?tab=stock`)}
                    >
                      Cargar stock
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
