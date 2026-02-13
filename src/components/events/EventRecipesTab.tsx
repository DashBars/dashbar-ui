import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useEventRecipes, useCreateRecipe, useDeleteRecipe, useUpdateRecipe } from '@/hooks/useRecipes';
import { useBars } from '@/hooks/useBars';
import { useBarTypeDrinks } from '@/hooks/useStock';
import { Skeleton } from '@/components/ui/skeleton';
import type { BarType, EventRecipe } from '@/lib/api/types';
import { toast } from 'sonner';
import { X, Plus, Check, GlassWater, Snowflake, Info, Beaker, Pencil, ChevronRight, ChevronLeft, Layers, Store, AlertTriangle, Package, TrendingUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EventRecipesTabProps {
  eventId: number;
  isEditable: boolean;
}

const ALL_BAR_TYPES: BarType[] = ['VIP', 'general', 'backstage', 'lounge'];

const barTypeLabels: Record<BarType, string> = {
  VIP: 'VIP',
  general: 'General',
  backstage: 'Backstage',
  lounge: 'Lounge',
};

export function EventRecipesTab({ eventId, isEditable }: EventRecipesTabProps) {
  const { data: recipes = [], isLoading } = useEventRecipes(eventId);
  const { data: bars = [] } = useBars(eventId);
  const createRecipe = useCreateRecipe(eventId);
  const deleteRecipe = useDeleteRecipe(eventId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<EventRecipe | null>(null);
  const [showCocktailSuggestions, setShowCocktailSuggestions] = useState(false);
  const cocktailInputRef = useRef<HTMLInputElement>(null);
  const cocktailSuggestionsRef = useRef<HTMLDivElement>(null);

  // Stepper state (3 steps)
  const [step, setStep] = useState(1);

  // Step 1: Bar type + basic info
  const [selectedBarType, setSelectedBarType] = useState<BarType | ''>('');
  const [cocktailName, setCocktailName] = useState('');
  const [glassVolume, setGlassVolume] = useState('');
  const [hasIce, setHasIce] = useState(false);

  // Step 2: Components
  const [components, setComponents] = useState<Array<{ drinkId: string; percentage: string }>>([]);

  // Step 3: Price
  const [salePrice, setSalePrice] = useState('');

  const updateRecipe = useUpdateRecipe(eventId, editingRecipe?.id || 0);

  // Get recipe drinks aggregated across all bars of the selected type
  const { data: barTypeDrinks = [], isLoading: isLoadingDrinks } = useBarTypeDrinks(
    eventId,
    selectedBarType,
  );

  // Derive which bar types actually exist in this event
  const eventBarTypes = useMemo(() => {
    const types = new Set<BarType>();
    bars.forEach((b) => types.add(b.type));
    return ALL_BAR_TYPES.filter((t) => types.has(t));
  }, [bars]);

  // Get unique cocktail names from existing recipes in this event only
  const existingCocktailNames = useMemo(() => {
    const names = new Set<string>();
    recipes.forEach((r) => names.add(r.cocktailName));
    return Array.from(names).sort();
  }, [recipes]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleOpenDialog = (recipe?: EventRecipe) => {
    setStep(1);
    if (recipe) {
      setEditingRecipe(recipe);
      setCocktailName(recipe.cocktailName);
      setGlassVolume(recipe.glassVolume.toString());
      setSalePrice(recipe.salePrice > 0 ? (recipe.salePrice / 100).toString() : '');
      setHasIce(recipe.hasIce);
      setComponents(
        recipe.components.map((c) => ({
          drinkId: c.drinkId.toString(),
          percentage: c.percentage.toString(),
        })),
      );
      // Pre-select the bar type from the recipe
      setSelectedBarType(recipe.barTypes.length > 0 ? recipe.barTypes[0] : '');
    } else {
      setEditingRecipe(null);
      setCocktailName('');
      setGlassVolume('');
      setSalePrice('');
      setHasIce(false);
      setSelectedBarType('');
      setComponents([]);
    }
    setDialogOpen(true);
  };

  const handleAddComponent = () => {
    setComponents([...components, { drinkId: '', percentage: '' }]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: 'drinkId' | 'percentage', value: string) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  // Check if bar type has enough recipe ingredients
  const hasEnoughIngredients = barTypeDrinks.length >= 2;

  // Validate step 1 (bar type + basic info)
  const validateStep1 = (): string | null => {
    if (!selectedBarType) {
      return 'Selecciona un tipo de barra';
    }
    if (!hasEnoughIngredients) {
      return `Las barras "${barTypeLabels[selectedBarType]}" necesitan al menos 2 insumos para recetas. Carga stock como "Para recetas" desde la tab Barras.`;
    }
    if (!cocktailName.trim()) {
      return 'El nombre del trago es requerido';
    }
    if (!glassVolume || parseInt(glassVolume, 10) <= 0) {
      return 'El volumen del vaso debe ser mayor a 0';
    }
    return null;
  };

  // Validate step 2 (components)
  const validateStep2 = (): string | null => {
    if (components.length < 2) {
      return 'Las recetas requieren al menos 2 componentes. Para vender un insumo individual, usa "Venta directa" al asignar stock.';
    }
    for (const component of components) {
      if (!component.drinkId || !component.percentage) {
        return 'Todos los componentes deben tener insumo y porcentaje';
      }
      const percentage = parseInt(component.percentage, 10);
      if (isNaN(percentage) || percentage < 1 || percentage > 100) {
        return 'Los porcentajes deben estar entre 1 y 100';
      }
    }
    const totalPct = components.reduce(
      (sum, c) => sum + parseInt(c.percentage || '0', 10),
      0,
    );
    if (totalPct > 100) {
      return `La suma de porcentajes (${totalPct}%) no puede exceder 100%`;
    }
    return null;
  };

  // Validate step 3 (price)
  const validateStep3 = (): string | null => {
    const price = parseFloat(salePrice || '0');
    if (price <= 0) {
      return 'El precio de venta debe ser mayor a 0';
    }
    // Duplicate name + bar type check
    if (!editingRecipe && selectedBarType) {
      const existing = recipes.find(
        (r) =>
          r.cocktailName.toLowerCase() === cocktailName.trim().toLowerCase() &&
          r.barTypes.includes(selectedBarType),
      );
      if (existing) {
        return `Ya existe una receta "${cocktailName}" para barras ${barTypeLabels[selectedBarType]}`;
      }
    }
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      const error = validateStep1();
      if (error) { toast.error(error); return; }
      setStep(2);
    } else if (step === 2) {
      const error = validateStep2();
      if (error) { toast.error(error); return; }
      setStep(3);
    }
  };

  const handleSubmit = () => {
    const error = validateStep3();
    if (error) { toast.error(error); return; }

    const price = parseFloat(salePrice || '0');
    const barTypes: BarType[] = selectedBarType ? [selectedBarType] : [];

    const dto = {
      cocktailName: cocktailName.trim(),
      glassVolume: parseInt(glassVolume, 10),
      salePrice: price > 0 ? Math.round(price * 100) : 0,
      hasIce,
      barTypes: price > 0 ? barTypes : [],
      components: components.map((c) => ({
        drinkId: parseInt(c.drinkId, 10),
        percentage: parseInt(c.percentage, 10),
      })),
    };

    if (editingRecipe) {
      updateRecipe.mutate(dto, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingRecipe(null);
        },
      });
    } else {
      createRecipe.mutate(dto, {
        onSuccess: () => {
          setDialogOpen(false);
        },
      });
    }
  };

  const totalPercentage = useMemo(() => {
    return components.reduce((sum, c) => sum + parseInt(c.percentage || '0', 10), 0);
  }, [components]);

  // Calculate estimated ice and liquid volumes
  const volumeCalculations = useMemo(() => {
    const glass = parseInt(glassVolume || '0', 10);
    if (glass <= 0) return null;

    let iceVolume: number;
    if (glass <= 250) {
      iceVolume = Math.round(glass * 0.3);
    } else if (glass <= 350) {
      iceVolume = Math.round(glass * 0.33);
    } else {
      iceVolume = Math.round(glass * 0.4);
    }

    const liquidVolume = glass - iceVolume;

    return { glassVolume: glass, iceVolume, liquidVolume };
  }, [glassVolume]);

  // Close cocktail suggestions on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        cocktailSuggestionsRef.current &&
        !cocktailSuggestionsRef.current.contains(e.target as Node) &&
        cocktailInputRef.current &&
        !cocktailInputRef.current.contains(e.target as Node)
      ) {
        setShowCocktailSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredCocktailNames = useMemo(() => {
    if (!cocktailName.trim()) return existingCocktailNames;
    const q = cocktailName.toLowerCase();
    return existingCocktailNames.filter((n) => n.toLowerCase().includes(q));
  }, [cocktailName, existingCocktailNames]);

  const isNewCocktailName =
    cocktailName.trim() !== '' &&
    !existingCocktailNames.some((n) => n.toLowerCase() === cocktailName.toLowerCase().trim());

  // Calculate estimated cost of the recipe (in cents) from component costs
  const estimatedCost = useMemo(() => {
    if (components.length === 0 || barTypeDrinks.length === 0) return null;

    const baseVolume =
      hasIce && volumeCalculations
        ? volumeCalculations.liquidVolume
        : parseInt(glassVolume || '0', 10);

    if (baseVolume <= 0) return null;

    let totalCostCents = 0;
    let allHaveCost = true;
    const breakdown: { name: string; ml: number; costCents: number }[] = [];

    for (const c of components) {
      const drink = barTypeDrinks.find((d) => d.drinkId.toString() === c.drinkId);
      if (!drink) continue;

      const pct = parseInt(c.percentage || '0', 10);
      const mlUsed = (baseVolume * pct) / 100;
      const costPerMl = drink.costPerMl || 0;
      const componentCost = costPerMl * mlUsed;

      if (costPerMl <= 0) allHaveCost = false;

      breakdown.push({
        name: drink.name,
        ml: Math.round(mlUsed),
        costCents: componentCost,
      });

      totalCostCents += componentCost;
    }

    return { totalCostCents, breakdown, allHaveCost };
  }, [components, barTypeDrinks, glassVolume, hasIce, volumeCalculations]);

  // Filter state for recipe cards
  const [cardFilter, setCardFilter] = useState<'all' | 'direct' | 'cocktail'>('all');

  const individualRecipes = useMemo(() => {
    if (cardFilter === 'all') return recipes;
    return recipes.filter((r) => {
      const isDirectSale = r.components.length === 1 && r.components[0].percentage === 100;
      return cardFilter === 'direct' ? isDirectSale : !isDirectSale;
    });
  }, [recipes, cardFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recetas y Productos</h2>
          <p className="text-sm text-muted-foreground">
            Defini las recetas de tragos usando los insumos cargados en las barras.
          </p>
        </div>
        {isEditable && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva receta
          </Button>
        )}
      </div>

      {/* Filter buttons */}
      {!isLoading && recipes.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1.5">
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
              Cocteles ({recipes.filter((r) => !(r.components.length === 1 && r.components[0].percentage === 100)).length})
            </Button>
            <Button
              variant={cardFilter === 'direct' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs px-3 gap-1"
              onClick={() => setCardFilter('direct')}
            >
              <Package className="h-3 w-3" />
              Venta directa ({recipes.filter((r) => r.components.length === 1 && r.components[0].percentage === 100).length})
            </Button>
          </div>
        </div>
      )}

      {/* Recipe cards grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : individualRecipes.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GlassWater className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {cardFilter !== 'all'
                ? `No hay ${cardFilter === 'direct' ? 'productos de venta directa' : 'cocteles'} configurados.`
                : 'Todavia no hay recetas configuradas para este evento.'}
            </p>
            {isEditable && cardFilter === 'all' && (
              <p className="text-xs text-muted-foreground mt-1">
                Carga stock a las barras primero y luego crea recetas con esos insumos.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {individualRecipes.map((recipe) => {
            const totalPerc = recipe.components.reduce((sum, c) => sum + c.percentage, 0);
            const isForSale = recipe.salePrice > 0;
            const isDirectSale = recipe.components.length === 1 && recipe.components[0].percentage === 100;

            return (
              <Card key={recipe.id} className="rounded-xl flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {isDirectSale ? (
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0">
                          <Package className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                          <Beaker className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <CardTitle className="text-base truncate">{recipe.cocktailName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isForSale && (
                        <Badge variant="default" className="gap-1">
                          {formatPrice(recipe.salePrice)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs py-0 font-normal',
                        isDirectSale
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
                      )}
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
                    {!isDirectSale && (
                      <span className="flex items-center gap-1">
                        <Beaker className="h-3.5 w-3.5" />
                        {recipe.components.length} insumos
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  {/* Components with progress bars */}
                  <div className="space-y-1.5">
                    {recipe.components.map((component) => (
                      <div
                        key={component.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground truncate mr-2">
                          {component.drink?.name || 'Insumo desconocido'}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                isDirectSale ? 'bg-green-500/60' : 'bg-primary/60',
                              )}
                              style={{ width: `${component.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">
                            {component.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {totalPerc < 100 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground italic">Resto (hielo, agua, etc.)</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-muted-foreground/20"
                              style={{ width: `${100 - totalPerc}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right text-muted-foreground">
                            {100 - totalPerc}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bar types */}
                  {recipe.barTypes.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-auto pt-3 border-t mt-3">
                      <span className="text-xs text-muted-foreground">Barras:</span>
                      {recipe.barTypes.map((bt) => (
                        <Badge key={bt} variant="outline" className="text-xs py-0">
                          {barTypeLabels[bt]}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {isEditable && (
                    <div className="flex justify-end gap-1 mt-3 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleOpenDialog(recipe)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => deleteRecipe.mutate(recipe.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stepper Dialog — 3 steps */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? 'Editar receta' : 'Nueva receta'}</DialogTitle>
            <DialogDescription>
              {step === 1 && 'Paso 1 de 3 — Tipo de barra, nombre del trago y volumen del vaso.'}
              {step === 2 && 'Paso 2 de 3 — Agrega los componentes usando los insumos de las barras.'}
              {step === 3 && 'Paso 3 de 3 — Configura el precio de venta.'}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <Store className="h-3.5 w-3.5" />
              Tipo de barra
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <Beaker className="h-3.5 w-3.5" />
              Componentes
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Precio
            </div>
          </div>

          {/* Step 1: Bar type + basic info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>
                  Tipo de barra <span className="text-destructive">*</span>
                </Label>
                {eventBarTypes.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        No hay barras creadas en este evento. Crea barras primero desde la tab "Barras".
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {eventBarTypes.map((bt) => {
                      const barsOfType = bars.filter((b) => b.type === bt);
                      const isSelected = selectedBarType === bt;
                      return (
                        <button
                          key={bt}
                          type="button"
                          onClick={() => {
                            setSelectedBarType(bt);
                            // Reset components when bar type changes
                            setComponents([]);
                          }}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'hover:bg-muted/50',
                          )}
                        >
                          <div
                            className={cn(
                              'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {barTypeLabels[bt].charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{barTypeLabels[bt]}</p>
                            <p className="text-xs text-muted-foreground">
                              {barsOfType.length} barra{barsOfType.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedBarType && (
                  <p className="text-xs text-muted-foreground">
                    La receta se asignara a todas las barras de tipo "{barTypeLabels[selectedBarType]}"
                  </p>
                )}
              </div>

              {/* Ingredient availability warning */}
              {selectedBarType && !isLoadingDrinks && !hasEnoughIngredients && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      <p className="font-medium">
                        Se necesitan al menos 2 insumos para recetas
                      </p>
                      <p>
                        Las barras de tipo "{barTypeLabels[selectedBarType]}" tienen {barTypeDrinks.length} insumo{barTypeDrinks.length !== 1 ? 's' : ''} para recetas.
                        Carga mas stock como "Para recetas" desde la tab "Barras" usando "Cargar Stock a Barras".
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBarType && !isLoadingDrinks && hasEnoughIngredients && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-2 px-3">
                  <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    {barTypeDrinks.length} insumos disponibles para recetas
                  </p>
                </div>
              )}

              <div className="grid gap-2 relative">
                <Label htmlFor="cocktailName">Nombre del trago</Label>
                <Input
                  ref={cocktailInputRef}
                  id="cocktailName"
                  value={cocktailName}
                  onChange={(e) => {
                    setCocktailName(e.target.value);
                    setShowCocktailSuggestions(true);
                  }}
                  onFocus={() => setShowCocktailSuggestions(true)}
                  placeholder="Buscar o crear trago..."
                  autoComplete="off"
                />
                {showCocktailSuggestions && (filteredCocktailNames.length > 0 || isNewCocktailName) && (
                  <div
                    ref={cocktailSuggestionsRef}
                    className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto"
                  >
                    {filteredCocktailNames.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2 text-sm"
                        onClick={() => {
                          setCocktailName(n);
                          setShowCocktailSuggestions(false);
                        }}
                      >
                        <Check className={cn('h-3.5 w-3.5 shrink-0', cocktailName === n ? 'opacity-100' : 'opacity-0')} />
                        <span>{n}</span>
                        <Badge variant="secondary" className="ml-auto text-xs font-normal">existente</Badge>
                      </button>
                    ))}
                    {isNewCocktailName && (
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2 text-sm border-t"
                        onClick={() => setShowCocktailSuggestions(false)}
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span>Crear "<strong>{cocktailName}</strong>"</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="glassVolume">Volumen del vaso (ml)</Label>
                <Input
                  id="glassVolume"
                  type="number"
                  min="1"
                  value={glassVolume}
                  onChange={(e) => setGlassVolume(e.target.value)}
                  required
                  placeholder="Ej: 350"
                />
                <p className="text-xs text-muted-foreground">
                  Capacidad total del vaso. Ejemplos: vaso estandar 300-330ml, highball 400-500ml
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasIce"
                    checked={hasIce}
                    onCheckedChange={(checked) => setHasIce(checked === true)}
                  />
                  <Label htmlFor="hasIce" className="cursor-pointer flex items-center gap-1.5">
                    <Snowflake className="h-4 w-4 text-blue-500" />
                    Lleva hielo
                  </Label>
                </div>

                {hasIce && volumeCalculations && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <p className="font-medium">Calculo de volumen con hielo</p>
                        <p>
                          El hielo ocupa aproximadamente <span className="font-semibold">{volumeCalculations.iceVolume}ml</span> del
                          vaso, dejando <span className="font-semibold">{volumeCalculations.liquidVolume}ml</span> para liquido.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-6 rounded-md overflow-hidden flex text-xs font-medium">
                        <div
                          className="bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-200"
                          style={{ width: `${(volumeCalculations.iceVolume / volumeCalculations.glassVolume) * 100}%` }}
                        >
                          Hielo
                        </div>
                        <div
                          className="bg-primary/20 flex items-center justify-center text-primary"
                          style={{ width: `${(volumeCalculations.liquidVolume / volumeCalculations.glassVolume) * 100}%` }}
                        >
                          Liquido
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">{volumeCalculations.glassVolume}ml</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Components (from bar type stock) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-medium">{cocktailName}</p>
                <p className="text-xs text-muted-foreground">
                  {glassVolume}ml{hasIce ? ' · Con hielo' : ''} · Barras {selectedBarType ? barTypeLabels[selectedBarType] : ''}
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Componentes</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddComponent}
                    disabled={barTypeDrinks.length === 0 || totalPercentage >= 100}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>

                {totalPercentage >= 100 && components.length > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-2 px-3">
                    <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      Composicion completa al {totalPercentage}% — no se pueden agregar mas componentes
                    </p>
                  </div>
                )}

                {components.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Agrega al menos 2 componentes con su porcentaje
                  </p>
                ) : (
                  <div className="space-y-2">
                    {components.map((component, index) => {
                      const percentage = parseInt(component.percentage || '0', 10);
                      const baseVolume =
                        hasIce && volumeCalculations
                          ? volumeCalculations.liquidVolume
                          : parseInt(glassVolume || '0', 10);
                      const mlValue =
                        baseVolume > 0 && percentage > 0
                          ? Math.round((baseVolume * percentage) / 100)
                          : 0;

                      // Find selected drink to show stock info
                      const selectedDrink = barTypeDrinks.find(
                        (d) => d.drinkId.toString() === component.drinkId,
                      );

                      return (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1 grid gap-1">
                            <Select
                              value={component.drinkId}
                              onValueChange={(value) =>
                                handleComponentChange(index, 'drinkId', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar insumo" />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingDrinks ? (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    Cargando insumos...
                                  </div>
                                ) : (
                                  barTypeDrinks.map((drink) => (
                                    <SelectItem key={drink.drinkId} value={drink.drinkId.toString()}>
                                      {drink.name} - {drink.brand} ({drink.unitCount} un.)
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {selectedDrink && (
                              <p className="text-xs text-muted-foreground pl-1">
                                Stock: {selectedDrink.unitCount} unidades ({(selectedDrink.totalMl / 1000).toFixed(1)}L)
                              </p>
                            )}
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              min="1"
                              max={100 - (totalPercentage - parseInt(component.percentage || '0', 10))}
                              value={component.percentage}
                              onChange={(e) => {
                                const othersTotal = totalPercentage - parseInt(component.percentage || '0', 10);
                                const maxAllowed = 100 - othersTotal;
                                const val = parseInt(e.target.value || '0', 10);
                                if (val > maxAllowed) {
                                  handleComponentChange(index, 'percentage', maxAllowed.toString());
                                } else {
                                  handleComponentChange(index, 'percentage', e.target.value);
                                }
                              }}
                              placeholder="%"
                            />
                          </div>
                          {mlValue > 0 && (
                            <div className="w-16 h-9 flex items-center justify-center text-xs text-muted-foreground bg-muted rounded-md">
                              {mlValue}ml
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveComponent(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    {/* Summary */}
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total porcentaje:</span>
                        <span className={cn('font-medium', totalPercentage > 100 && 'text-destructive')}>
                          {totalPercentage}%
                          {totalPercentage > 100 && ' (excede 100%)'}
                        </span>
                      </div>
                      {glassVolume && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Volumen liquido total:</span>
                          <span className="font-medium">
                            {(() => {
                              const baseVolume =
                                hasIce && volumeCalculations
                                  ? volumeCalculations.liquidVolume
                                  : parseInt(glassVolume || '0', 10);
                              const totalMl = Math.round((baseVolume * totalPercentage) / 100);
                              return `${totalMl}ml de ${baseVolume}ml`;
                            })()}
                          </span>
                        </div>
                      )}
                      {totalPercentage < 100 && totalPercentage > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Falta {100 - totalPercentage}% para completar el vaso
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Price */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Recipe summary */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-sm font-medium">{cocktailName}</p>
                <p className="text-xs text-muted-foreground">
                  {glassVolume}ml · {components.length} componentes{hasIce ? ' · Con hielo' : ''} · Barras {selectedBarType ? barTypeLabels[selectedBarType] : ''}
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
                  {components.map((c, i) => {
                    const drink = barTypeDrinks.find((d) => d.drinkId.toString() === c.drinkId);
                    return (
                      <div key={i} className="flex justify-between">
                        <span>{drink?.name || 'Insumo'}</span>
                        <span>{c.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estimated cost breakdown */}
              {estimatedCost && estimatedCost.totalCostCents > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Costo estimado del trago
                  </p>
                  <div className="space-y-1">
                    {estimatedCost.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.name} ({item.ml}ml)</span>
                        <span>${(item.costCents / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-1.5 border-t">
                    <span>Costo total</span>
                    <span>${(estimatedCost.totalCostCents / 100).toFixed(2)}</span>
                  </div>
                  {!estimatedCost.allHaveCost && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Algunos insumos no tienen costo cargado. El calculo es aproximado.
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="salePrice">
                  Precio de venta ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Ej: 50.00"
                />
              </div>

              {/* Profit margin */}
              {estimatedCost && estimatedCost.totalCostCents > 0 && parseFloat(salePrice || '0') > 0 && (
                (() => {
                  const costPesos = estimatedCost.totalCostCents / 100;
                  const salePriceNum = parseFloat(salePrice);
                  const profit = salePriceNum - costPesos;
                  const marginPct = costPesos > 0 ? ((profit) / costPesos) * 100 : 0;
                  const isPositive = profit > 0;
                  return (
                    <div
                      className={cn(
                        'flex items-center justify-between text-sm rounded-lg px-3 py-2',
                        isPositive
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className={cn('h-4 w-4', !isPositive && 'rotate-180')} />
                        <span>Margen de ganancia:</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{marginPct.toFixed(1)}%</span>
                        <span className="text-xs ml-1">(${profit.toFixed(2)}/trago)</span>
                      </div>
                    </div>
                  );
                })()
              )}

              {selectedBarType && (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3">
                  <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Esta receta se asignara a todas las barras de tipo <strong>{barTypeLabels[selectedBarType]}</strong> en este evento.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            {step === 1 && (
              <>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleNext} disabled={!selectedBarType || !hasEnoughIngredients}>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Volver
                </Button>
                <Button type="button" onClick={handleNext}>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
            {step === 3 && (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isEditable || createRecipe.isPending || updateRecipe.isPending}
                >
                  {editingRecipe ? 'Actualizar' : 'Guardar receta'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
