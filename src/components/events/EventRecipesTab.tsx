import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useEventRecipes, useCreateRecipe, useDeleteRecipe, useUpdateRecipe } from '@/hooks/useRecipes';
import { useDrinks } from '@/hooks/useDrinks';
import { Skeleton } from '@/components/ui/skeleton';
import type { BarType, EventRecipe } from '@/lib/api/types';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';

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

export function EventRecipesTab({ eventId, isEditable }: EventRecipesTabProps) {
  const { data: recipes = [], isLoading } = useEventRecipes(eventId);
  const { data: drinks = [], isLoading: isLoadingDrinks } = useDrinks();
  const createRecipe = useCreateRecipe(eventId);
  const deleteRecipe = useDeleteRecipe(eventId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<EventRecipe | null>(null);
  
  // Form state
  const [cocktailName, setCocktailName] = useState('');
  const [glassVolume, setGlassVolume] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [hasIce, setHasIce] = useState(false);
  const [selectedBarTypes, setSelectedBarTypes] = useState<BarType[]>([]);
  const [components, setComponents] = useState<Array<{ drinkId: string; percentage: string }>>([]);

  const updateRecipe = useUpdateRecipe(eventId, editingRecipe?.id || 0);

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
      setSalePrice((recipe.salePrice / 100).toString());
      setHasIce(recipe.hasIce);
      setSelectedBarTypes([...recipe.barTypes]);
      setComponents(
        recipe.components.map((c) => ({
          drinkId: c.drinkId.toString(),
          percentage: c.percentage.toString(),
        })),
      );
    } else {
      setEditingRecipe(null);
      setCocktailName('');
      setGlassVolume('');
      setSalePrice('');
      setHasIce(false);
      setSelectedBarTypes([]);
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
    if (!salePrice || parseFloat(salePrice) <= 0) {
      return 'El precio de venta debe ser mayor a 0';
    }
    if (selectedBarTypes.length === 0) {
      return 'Debes seleccionar al menos un tipo de barra';
    }
    if (components.length === 0) {
      return 'Debes agregar al menos un componente';
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
      salePrice: Math.round(parseFloat(salePrice) * 100), // Convert to cents
      hasIce,
      barTypes: selectedBarTypes,
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

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recetas de cocktails</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define las recetas de cocktails con sus insumos, porcentajes, volumen del vaso y precio de venta.
              Cada receta puede aplicarse a múltiples tipos de barra.
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
            <div className="space-y-6">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="rounded-lg border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{recipe.cocktailName}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          {recipe.barTypes.map((bt) => (
                            <Badge key={bt} variant="outline">
                              {barTypeLabels[bt]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {isEditable && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(recipe)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteRecipe.mutate(recipe.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Volumen del vaso:</span>
                        <p className="font-medium">{recipe.glassVolume} ml</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Precio de venta:</span>
                        <p className="font-medium">{formatPrice(recipe.salePrice)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lleva hielo:</span>
                        <p className="font-medium">{recipe.hasIce ? 'Sí' : 'No'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Componentes:</span>
                        <p className="font-medium">{recipe.components.length}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Insumo</TableHead>
                            <TableHead>Porcentaje</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recipe.components.map((component) => (
                            <TableRow key={component.id}>
                              <TableCell className="font-medium">
                                {getDrinkLabel(component.drinkId)}
                              </TableCell>
                              <TableCell>{component.percentage}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                Define el nombre del cocktail, volumen del vaso, precio, tipos de barra y componentes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cocktailName">Nombre del cocktail</Label>
                <Input
                  id="cocktailName"
                  value={cocktailName}
                  onChange={(e) => setCocktailName(e.target.value)}
                  required
                  placeholder="Ej: Fernet con Coca"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="glassVolume">Volumen del vaso (ml)</Label>
                  <Input
                    id="glassVolume"
                    type="number"
                    min="1"
                    value={glassVolume}
                    onChange={(e) => setGlassVolume(e.target.value)}
                    required
                    placeholder="Ej: 200"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="salePrice">Precio de venta ($)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    required
                    placeholder="Ej: 50.00"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasIce"
                  checked={hasIce}
                  onCheckedChange={(checked) => setHasIce(checked === true)}
                />
                <Label htmlFor="hasIce" className="cursor-pointer">
                  Lleva hielo
                </Label>
              </div>

              <div className="grid gap-2">
                <Label>Tipos de barra</Label>
                <div className="flex flex-wrap gap-2">
                  {(['VIP', 'general', 'backstage', 'lounge'] as BarType[]).map((barType) => (
                    <Button
                      key={barType}
                      type="button"
                      variant={selectedBarTypes.includes(barType) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleBarTypeToggle(barType)}
                    >
                      {barTypeLabels[barType]}
                    </Button>
                  ))}
                </div>
                {selectedBarTypes.length === 0 && (
                  <p className="text-xs text-destructive">Selecciona al menos un tipo de barra</p>
                )}
              </div>

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
                    {components.map((component, index) => (
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveComponent(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground">
                      Total: {totalPercentage}% {totalPercentage > 100 && '(excede 100%)'}
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
