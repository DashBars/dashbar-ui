import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEventRecipes, useCreateRecipe, useDeleteRecipe, useUpdateRecipe } from '@/hooks/useRecipes';
import { useDrinks } from '@/hooks/useDrinks';
import { Skeleton } from '@/components/ui/skeleton';
import type { BarType, EventRecipe } from '@/lib/api/types';
import { toast } from 'sonner';
import { X, Plus, ChevronsUpDown, Check, GlassWater, Thermometer, DollarSign, Beaker, Snowflake, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EventRecipesTabProps {
  eventId: number;
  isEditable: boolean;
}

const barTypeLabels: Record<BarType, string> = {
  VIP: 'VIP',
  general: 'General',
  backstage: 'Backstage',
  lounge: 'Lounge',
};

const ALL_BAR_TYPES: BarType[] = ['VIP', 'general', 'backstage', 'lounge'];

export function EventRecipesTab({ eventId, isEditable }: EventRecipesTabProps) {
  const { data: recipes = [], isLoading } = useEventRecipes(eventId);
  const { data: drinks = [], isLoading: isLoadingDrinks } = useDrinks();
  // Removed global cocktails - only use recipe names from current event
  const createRecipe = useCreateRecipe(eventId);
  const deleteRecipe = useDeleteRecipe(eventId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<EventRecipe | null>(null);
  const [cocktailSelectorOpen, setCocktailSelectorOpen] = useState(false);
  
  // Form state
  const [cocktailName, setCocktailName] = useState('');
  const [glassVolume, setGlassVolume] = useState('');
  const [isFinalProduct, setIsFinalProduct] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [hasIce, setHasIce] = useState(false);
  const [selectedBarTypes, setSelectedBarTypes] = useState<BarType[]>([]);
  const [components, setComponents] = useState<Array<{ drinkId: string; percentage: string }>>([]);
  const [disabledBarTypes, setDisabledBarTypes] = useState<BarType[]>([]);

  const updateRecipe = useUpdateRecipe(eventId, editingRecipe?.id || 0);

  // Get unique cocktail names from existing recipes in this event only
  const existingCocktailNames = useMemo(() => {
    const names = new Set<string>();
    recipes.forEach(r => names.add(r.cocktailName));
    return Array.from(names).sort();
  }, [recipes]);

  // Generate a component signature for a recipe (sorted drink IDs)
  const getComponentSignature = (recipe: EventRecipe): string => {
    return recipe.components
      .map(c => c.drinkId)
      .sort((a, b) => a - b)
      .join('-');
  };

  // Get a canonical name for a group of recipes based on their components
  const getCanonicalName = (recipeNames: string[], componentDrinkIds: number[]): string => {
    // If all recipes have the same name, use it
    const uniqueNames = [...new Set(recipeNames.map(n => n.toLowerCase().trim()))];
    if (uniqueNames.length === 1) {
      return recipeNames[0];
    }
    
    // Otherwise, try to find the most common/shortest name or generate one from components
    const sortedByLength = [...recipeNames].sort((a, b) => a.length - b.length);
    return sortedByLength[0];
  };

  // Group recipes by component signature (same ingredients = same drink, different variants)
  const groupedRecipes = useMemo(() => {
    const groups = new Map<string, { 
      displayName: string; 
      alternateNames: string[];
      recipes: EventRecipe[];
      componentDrinkIds: number[];
    }>();
    
    recipes.forEach(recipe => {
      const signature = getComponentSignature(recipe);
      const existing = groups.get(signature);
      
      if (existing) {
        existing.recipes.push(recipe);
        // Track alternate names
        if (!existing.alternateNames.includes(recipe.cocktailName)) {
          existing.alternateNames.push(recipe.cocktailName);
        }
        // Update display name to the canonical one
        existing.displayName = getCanonicalName(
          existing.alternateNames,
          existing.componentDrinkIds
        );
      } else {
        groups.set(signature, {
          displayName: recipe.cocktailName,
          alternateNames: [recipe.cocktailName],
          recipes: [recipe],
          componentDrinkIds: recipe.components.map(c => c.drinkId).sort((a, b) => a - b)
        });
      }
    });
    
    return Array.from(groups.values()).map(g => {
      // Calculate covered bar types across all variants
      const coveredBarTypes = new Set<BarType>();
      g.recipes.forEach(r => r.barTypes.forEach(bt => coveredBarTypes.add(bt)));
      const allBarTypesCovered = ALL_BAR_TYPES.every(bt => coveredBarTypes.has(bt));
      
      return {
        displayName: g.displayName,
        alternateNames: g.alternateNames,
        recipes: g.recipes,
        hasMultipleNames: g.alternateNames.length > 1,
        coveredBarTypes: Array.from(coveredBarTypes),
        allBarTypesCovered,
      };
    });
  }, [recipes]);

  const getDrinkLabel = (id: number) => {
    const drink = drinks.find((d) => d.id === id);
    return drink ? `${drink.name} - ${drink.brand}` : `Drink ${id}`;
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleOpenDialog = (recipe?: EventRecipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setCocktailName(recipe.cocktailName);
      setGlassVolume(recipe.glassVolume.toString());
      const hasPriceOrBarTypes = recipe.salePrice > 0 || recipe.barTypes.length > 0;
      setIsFinalProduct(hasPriceOrBarTypes);
      setSalePrice((recipe.salePrice / 100).toString());
      setHasIce(recipe.hasIce);
      setSelectedBarTypes([...recipe.barTypes]);
      setComponents(
        recipe.components.map((c) => ({
          drinkId: c.drinkId.toString(),
          percentage: c.percentage.toString(),
        })),
      );
      // When editing, disable bar types used by OTHER variants of the same cocktail
      const otherVariantsBarTypes = new Set<BarType>();
      recipes
        .filter(r => r.cocktailName === recipe.cocktailName && r.id !== recipe.id)
        .forEach(r => r.barTypes.forEach(bt => otherVariantsBarTypes.add(bt)));
      setDisabledBarTypes(Array.from(otherVariantsBarTypes));
    } else {
      setEditingRecipe(null);
      setCocktailName('');
      setGlassVolume('');
      setIsFinalProduct(false);
      setSalePrice('');
      setHasIce(false);
      setSelectedBarTypes([]);
      setComponents([]);
      setDisabledBarTypes([]); // No disabled bar types for new cocktail
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

  const handleBarTypeToggle = (barType: BarType) => {
    if (selectedBarTypes.includes(barType)) {
      setSelectedBarTypes(selectedBarTypes.filter((bt) => bt !== barType));
    } else {
      setSelectedBarTypes([...selectedBarTypes, barType]);
    }
  };

  const validateForm = (): string | null => {
    if (!cocktailName.trim()) {
      return 'El nombre del cocktail es requerido';
    }
    if (!glassVolume || parseInt(glassVolume, 10) <= 0) {
      return 'El volumen del vaso debe ser mayor a 0';
    }
    if (isFinalProduct) {
      if (!salePrice || parseFloat(salePrice) <= 0) {
        return 'El precio de venta debe ser mayor a 0';
      }
      if (selectedBarTypes.length === 0) {
        return 'Debes seleccionar al menos un tipo de barra';
      }
    }
    if (components.length < 2) {
      return 'Las recetas requieren al menos 2 componentes. Para vender un insumo individual (ej: botella de agua), usá "Venta directa" al asignar stock.';
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
    const totalPercentage = components.reduce(
      (sum, c) => sum + parseInt(c.percentage || '0', 10),
      0,
    );
    if (totalPercentage > 100) {
      return `La suma de porcentajes (${totalPercentage}%) no puede exceder 100%`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const dto = {
      cocktailName: cocktailName.trim(),
      glassVolume: parseInt(glassVolume, 10),
      salePrice: isFinalProduct ? Math.round(parseFloat(salePrice || '0') * 100) : 0,
      hasIce,
      barTypes: isFinalProduct ? selectedBarTypes : [],
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
    
    // Ice volume estimation based on glass size
    // Standard glass (300-330ml): ~100ml ice
    // Large glass (400-500ml): ~150-200ml ice
    let iceVolume: number;
    if (glass <= 250) {
      iceVolume = Math.round(glass * 0.3); // ~30% for small glasses
    } else if (glass <= 350) {
      iceVolume = Math.round(glass * 0.33); // ~33% for standard glasses
    } else {
      iceVolume = Math.round(glass * 0.4); // ~40% for large glasses
    }
    
    const liquidVolume = glass - iceVolume;
    
    return {
      glassVolume: glass,
      iceVolume,
      liquidVolume,
    };
  }, [glassVolume]);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recetas de cocktails</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define las recetas de cocktails con sus insumos y porcentajes. Los porcentajes representan la proporción 
              del volumen líquido (si lleva hielo, se descuenta automáticamente del volumen del vaso).
            </p>
          </div>
          {isEditable && (
            <Button onClick={() => handleOpenDialog()}>Agregar receta</Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading || isLoadingDrinks ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay recetas configuradas para este evento.
            </p>
          ) : (
            <div className="space-y-4">
              {groupedRecipes.map((group) => {
                const { displayName, alternateNames, recipes: variants, hasMultipleNames, allBarTypesCovered } = group;
                
                // Get all unique components across all variants
                const allDrinkIds = new Set<number>();
                variants.forEach(v => v.components.forEach(c => allDrinkIds.add(c.drinkId)));
                const componentDrinks = Array.from(allDrinkIds);
                
                return (
                  <div key={displayName} className="rounded-xl border bg-card overflow-hidden">
                    {/* Cocktail Header */}
                    <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-semibold text-base flex items-center gap-2">
                          <GlassWater className="h-4 w-4 text-primary" />
                          {displayName}
                          <Badge variant="secondary" className="ml-2 font-normal">
                            {variants.length} {variants.length === 1 ? 'variante' : 'variantes'}
                          </Badge>
                        </h3>
                        {hasMultipleNames && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>También conocido como:</span>
                            {alternateNames
                              .filter(n => n !== displayName)
                              .map((name, i) => (
                                <Badge key={name} variant="outline" className="text-xs font-normal">
                                  {name}
                                </Badge>
                              ))}
                          </p>
                        )}
                      </div>
                      {isEditable && (
                        allBarTypesCovered ? (
                          <Badge variant="secondary" className="text-xs font-normal">
                            <Check className="h-3 w-3 mr-1" />
                            Todos los tipos de barra configurados
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Pre-fill with cocktail name for new variant
                              setEditingRecipe(null);
                              setCocktailName(displayName);
                              setGlassVolume('');
                              setIsFinalProduct(true);
                              // Pre-fill price from first variant for auto-merge to work
                              setSalePrice(variants[0]?.salePrice ? (variants[0].salePrice / 100).toString() : '');
                              setHasIce(variants[0]?.hasIce || false);
                              setSelectedBarTypes([]);
                              // Disable bar types already used by other variants
                              const usedBarTypes = new Set<BarType>();
                              variants.forEach(v => v.barTypes.forEach(bt => usedBarTypes.add(bt)));
                              setDisabledBarTypes(Array.from(usedBarTypes));
                              // Copy components from first variant as template
                              if (variants[0]) {
                                setComponents(
                                  variants[0].components.map((c) => ({
                                    drinkId: c.drinkId.toString(),
                                    percentage: c.percentage.toString(),
                                  }))
                                );
                              } else {
                                setComponents([]);
                              }
                              setDialogOpen(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Nueva variante
                          </Button>
                        )
                      )}
                    </div>
                    
                    {/* Comparison Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/20">
                            <th className="text-left font-medium px-4 py-2 text-muted-foreground">Barras</th>
                            <th className="text-center font-medium px-3 py-2 text-muted-foreground w-20">Vaso</th>
                            <th className="text-center font-medium px-3 py-2 text-muted-foreground w-20">Hielo</th>
                            <th className="text-right font-medium px-3 py-2 text-muted-foreground w-24">Precio</th>
                            {/* Component columns */}
                            {componentDrinks.map(drinkId => {
                              const drink = drinks.find(d => d.id === drinkId);
                              return (
                                <th key={drinkId} className="text-center font-medium px-3 py-2 text-muted-foreground min-w-[80px]">
                                  <div className="flex flex-col items-center">
                                    <span className="truncate max-w-[100px]" title={drink?.name}>
                                      {drink?.name || `#${drinkId}`}
                                    </span>
                                    <span className="text-xs font-normal opacity-70">{drink?.brand}</span>
                                  </div>
                                </th>
                              );
                            })}
                            {isEditable && <th className="w-24"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {variants.map((recipe) => (
                            <tr key={recipe.id} className="hover:bg-muted/30 transition-colors">
                              {/* Bar types */}
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {recipe.barTypes.length > 0 ? (
                                    recipe.barTypes.map((bt) => (
                                      <Badge key={bt} variant="default" className="text-xs">
                                        {barTypeLabels[bt]}
                                      </Badge>
                                    ))
                                  ) : (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                      Sin asignar
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              {/* Glass volume */}
                              <td className="text-center px-3 py-3">
                                <span className="font-medium">{recipe.glassVolume}</span>
                                <span className="text-muted-foreground text-xs ml-0.5">ml</span>
                              </td>
                              {/* Ice */}
                              <td className="text-center px-3 py-3">
                                {recipe.hasIce ? (
                                  <Snowflake className="h-4 w-4 text-blue-500 mx-auto" />
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              {/* Price */}
                              <td className="text-right px-3 py-3 font-medium">
                                {formatPrice(recipe.salePrice)}
                              </td>
                              {/* Component percentages */}
                              {componentDrinks.map(drinkId => {
                                const component = recipe.components.find(c => c.drinkId === drinkId);
                                return (
                                  <td key={drinkId} className="text-center px-3 py-3">
                                    {component ? (
                                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-semibold rounded px-2 py-0.5 min-w-[40px]">
                                        {component.percentage}%
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                );
                              })}
                              {/* Actions */}
                              {isEditable && (
                                <td className="px-3 py-3">
                                  <div className="flex gap-1 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => handleOpenDialog(recipe)}
                                    >
                                      Editar
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
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingRecipe ? 'Editar receta' : 'Nueva receta'}</DialogTitle>
              <DialogDescription>
                Define el nombre del cocktail, volumen del vaso y componentes. Si es producto final, podrás asignar precio y tipos de barra.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cocktailName">Nombre del cocktail</Label>
                <Popover open={cocktailSelectorOpen} onOpenChange={setCocktailSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={cocktailSelectorOpen}
                      className="w-full justify-between font-normal"
                    >
                      {cocktailName || "Seleccionar o escribir nombre..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar o crear cocktail..." 
                        value={cocktailName}
                        onValueChange={setCocktailName}
                      />
                      <CommandList>
                        {cocktailName && !existingCocktailNames.some(n => n.toLowerCase() === cocktailName.toLowerCase()) && (
                          <CommandGroup heading="Crear nuevo">
                            <CommandItem
                              value={cocktailName}
                              onSelect={() => {
                                setCocktailSelectorOpen(false);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Crear "{cocktailName}"
                            </CommandItem>
                          </CommandGroup>
                        )}
                        {existingCocktailNames.length > 0 && (
                          <CommandGroup heading="Cocktails existentes">
                            {existingCocktailNames
                              .filter(name => name.toLowerCase().includes(cocktailName.toLowerCase()))
                              .map((name) => (
                                <CommandItem
                                  key={name}
                                  value={name}
                                  onSelect={(value) => {
                                    setCocktailName(value);
                                    setCocktailSelectorOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      cocktailName === name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        )}
                        <CommandEmpty>
                          {cocktailName ? `Presiona Enter para crear "${cocktailName}"` : "Escribe para buscar o crear"}
                        </CommandEmpty>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Selecciona un cocktail existente para crear una variante, o escribe un nuevo nombre
                </p>
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
                  Capacidad total del vaso. Ejemplos: vaso estándar 300-330ml, highball 400-500ml
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
                
                {/* Ice volume helper */}
                {hasIce && volumeCalculations && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <p className="font-medium">Cálculo de volumen con hielo</p>
                        <p>
                          El hielo ocupa aproximadamente <span className="font-semibold">{volumeCalculations.iceVolume}ml</span> del 
                          vaso, dejando <span className="font-semibold">{volumeCalculations.liquidVolume}ml</span> para líquido.
                        </p>
                        <p className="text-blue-600 dark:text-blue-400">
                          Los porcentajes de los componentes deben sumar hasta 100% del <span className="font-semibold">volumen líquido</span> ({volumeCalculations.liquidVolume}ml), no del vaso completo.
                        </p>
                      </div>
                    </div>
                    
                    {/* Visual breakdown */}
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
                          Líquido
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">{volumeCalculations.glassVolume}ml</span>
                    </div>
                  </div>
                )}
                
                {!hasIce && glassVolume && (
                  <p className="text-xs text-muted-foreground">
                    Sin hielo, todo el volumen del vaso ({glassVolume}ml) es para líquido
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                <div>
                  <Label htmlFor="isFinalProduct" className="cursor-pointer text-sm font-medium">
                    Es producto final
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Asignar precio y tipos de barra para venta
                  </p>
                </div>
                <Switch
                  id="isFinalProduct"
                  checked={isFinalProduct}
                  onCheckedChange={(checked) => setIsFinalProduct(checked === true)}
                />
              </div>

              {isFinalProduct && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="salePrice">Precio de venta ($)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      required={isFinalProduct}
                      placeholder="Ej: 50.00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Tipos de barra</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['VIP', 'general', 'backstage', 'lounge'] as BarType[]).map((barType) => {
                        const isDisabled = disabledBarTypes.includes(barType);
                        return (
                          <Button
                            key={barType}
                            type="button"
                            variant={selectedBarTypes.includes(barType) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleBarTypeToggle(barType)}
                            disabled={isDisabled}
                            title={isDisabled ? 'Ya existe una variante para este tipo de barra' : undefined}
                          >
                            {barTypeLabels[barType]}
                          </Button>
                        );
                      })}
                    </div>
                    {selectedBarTypes.length === 0 && (
                      <p className="text-xs text-destructive">Selecciona al menos un tipo de barra</p>
                    )}
                    {disabledBarTypes.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Los tipos de barra deshabilitados ya tienen una variante configurada
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Componentes</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddComponent}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar componente
                  </Button>
                </div>
                {components.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Agrega al menos un componente con su porcentaje
                  </p>
                ) : (
                  <div className="space-y-2">
                    {components.map((component, index) => {
                      const percentage = parseInt(component.percentage || '0', 10);
                      const baseVolume = hasIce && volumeCalculations 
                        ? volumeCalculations.liquidVolume 
                        : parseInt(glassVolume || '0', 10);
                      const mlValue = baseVolume > 0 && percentage > 0 
                        ? Math.round((baseVolume * percentage) / 100) 
                        : 0;
                      
                      return (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1 grid gap-2">
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
                                {drinks.map((drink) => (
                                  <SelectItem key={drink.id} value={drink.id.toString()}>
                                    {drink.name} - {drink.brand}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={component.percentage}
                              onChange={(e) =>
                                handleComponentChange(index, 'percentage', e.target.value)
                              }
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
                        <span className={cn("font-medium", totalPercentage > 100 && "text-destructive")}>
                          {totalPercentage}%
                          {totalPercentage > 100 && ' (excede 100%)'}
                        </span>
                      </div>
                      {glassVolume && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Volumen líquido total:
                          </span>
                          <span className="font-medium">
                            {(() => {
                              const baseVolume = hasIce && volumeCalculations 
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isEditable || createRecipe.isPending || updateRecipe.isPending}
              >
                {editingRecipe ? 'Actualizar' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
