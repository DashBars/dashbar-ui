import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventRecipes } from '@/hooks/useRecipes';
import { GlassWater, Snowflake, Beaker, ExternalLink, Info } from 'lucide-react';
import type { BarType, EventRecipe } from '@/lib/api/types';

interface RecipeOverridesTabProps {
  eventId: number;
  barId: number;
  barType?: BarType;
}

const barTypeLabels: Record<BarType, string> = {
  VIP: 'VIP',
  general: 'General',
  backstage: 'Backstage',
  lounge: 'Lounge',
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function RecipeCard({ recipe }: { recipe: EventRecipe }) {
  const totalPercentage = recipe.components.reduce((sum, c) => sum + c.percentage, 0);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{recipe.cocktailName}</CardTitle>
          {recipe.salePrice > 0 && (
            <Badge variant="default" className="gap-1">
              {formatPrice(recipe.salePrice)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <GlassWater className="h-3.5 w-3.5" />
            {recipe.glassVolume}ml
          </span>
          {recipe.hasIce && (
            <span className="flex items-center gap-1">
              <Snowflake className="h-3.5 w-3.5 text-blue-500" />
              Con hielo
            </span>
          )}
          <span className="flex items-center gap-1">
            <Beaker className="h-3.5 w-3.5" />
            {recipe.components.length} insumos
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5">
          {recipe.components.map((component) => (
            <div
              key={component.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">
                {component.drink?.name || `Insumo ${component.drinkId}`}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${component.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">
                  {component.percentage}%
                </span>
              </div>
            </div>
          ))}
          {totalPercentage < 100 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground italic">Resto (hielo, agua, etc.)</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-muted-foreground/20"
                    style={{ width: `${100 - totalPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right text-muted-foreground">
                  {100 - totalPercentage}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecipeOverridesTab({
  eventId,
  barType,
}: RecipeOverridesTabProps) {
  const navigate = useNavigate();
  const { data: allRecipes = [], isLoading } = useEventRecipes(eventId);

  const recipes = useMemo(() => {
    if (!barType) return allRecipes;
    return allRecipes.filter((r) => r.barTypes.includes(barType));
  }, [allRecipes, barType]);

  const goToEventRecipes = () => {
    navigate(`/events/${eventId}`, { state: { tab: 'recipes' } });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            Recetas de barras {barType ? barTypeLabels[barType] : ''}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vista de las recetas asignadas a este tipo de barra. Las recetas se crean y editan desde el evento.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToEventRecipes}
          className="gap-1.5 shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Gestionar recetas del evento
        </Button>
      </div>

      {recipes.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Beaker className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay recetas para barras {barType ? barTypeLabels[barType] : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-sm">
              Las recetas se crean a nivel del evento y se asignan por tipo de barra.
              Necesitas al menos 2 insumos "Para recetas" cargados en la barra.
            </p>
            <Button
              variant="default"
              size="sm"
              className="mt-4 gap-1.5"
              onClick={goToEventRecipes}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ir a crear recetas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Info callout */}
          <div className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              {recipes.length} receta{recipes.length !== 1 ? 's' : ''} asignada{recipes.length !== 1 ? 's' : ''} a barras <strong>{barType ? barTypeLabels[barType] : ''}</strong>.
              Para crear, editar o eliminar recetas usa el boton "Gestionar recetas del evento".
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
