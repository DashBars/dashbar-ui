import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventRecipes } from '@/hooks/useRecipes';
import { GlassWater, Snowflake, Beaker, ExternalLink, Info, Package, Filter, Search } from 'lucide-react';
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
  const isDirectSale = recipe.components.length === 1 && recipe.components[0].percentage === 100;

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {isDirectSale ? (
              <Package className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <Beaker className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <CardTitle className="text-base truncate">{recipe.cocktailName}</CardTitle>
          </div>
          {recipe.salePrice > 0 && (
            <Badge variant="default" className="gap-1 shrink-0">
              {formatPrice(recipe.salePrice)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <Badge
            variant="secondary"
            className={
              isDirectSale
                ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950 text-[10px] py-0'
                : 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950 text-[10px] py-0'
            }
          >
            {isDirectSale ? 'Venta directa' : 'Coctel'}
          </Badge>
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

  // Filter state
  const [cardFilter, setCardFilter] = useState<'all' | 'direct' | 'cocktail'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const cocktailCount = useMemo(
    () => recipes.filter((r) => !(r.components.length === 1 && r.components[0].percentage === 100)).length,
    [recipes],
  );
  const directSaleCount = useMemo(
    () => recipes.filter((r) => r.components.length === 1 && r.components[0].percentage === 100).length,
    [recipes],
  );

  const filteredRecipes = useMemo(() => {
    let result = recipes;
    // Type filter
    if (cardFilter === 'direct') {
      result = result.filter((r) => r.components.length === 1 && r.components[0].percentage === 100);
    } else if (cardFilter === 'cocktail') {
      result = result.filter((r) => !(r.components.length === 1 && r.components[0].percentage === 100));
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.cocktailName.toLowerCase().includes(q) ||
          r.components.some((c) => c.drink?.name.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [recipes, cardFilter, searchQuery]);

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
              Para crear, editar o eliminar recetas usá el botón "Gestionar recetas del evento".
            </p>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-xs flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o insumo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={cardFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => setCardFilter('all')}
              >
                Todos ({recipes.length})
              </Button>
              <Button
                variant={cardFilter === 'cocktail' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-3 gap-1"
                onClick={() => setCardFilter('cocktail')}
              >
                <Beaker className="h-3 w-3" />
                Cocteles ({cocktailCount})
              </Button>
              <Button
                variant={cardFilter === 'direct' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-3 gap-1"
                onClick={() => setCardFilter('direct')}
              >
                <Package className="h-3 w-3" />
                Venta directa ({directSaleCount})
              </Button>
            </div>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No se encontraron recetas con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
