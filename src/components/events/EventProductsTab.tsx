import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useEventProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct 
} from '@/hooks/useProducts';
import { useEventRecipes } from '@/hooks/useRecipes';
import { useCocktails } from '@/hooks/useCocktails';
import { useBars } from '@/hooks/useBars';
import { Skeleton } from '@/components/ui/skeleton';
import type { EventProduct } from '@/lib/api/types';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, Info, Snowflake, GlassWater, Beaker } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventProductsTabProps {
  eventId: number;
  isEditable: boolean;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function EventProductsTab({ eventId, isEditable }: EventProductsTabProps) {
  const [scope, setScope] = useState<'event' | 'bar'>('event');
  const [selectedBarId, setSelectedBarId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EventProduct | null>(null);
  const [productName, setProductName] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [selectedCocktailIds, setSelectedCocktailIds] = useState<number[]>([]);

  // Only fetch when: scope='event' OR (scope='bar' AND a bar is selected)
  const { data: products = [], isLoading } = useEventProducts(
    eventId,
    scope === 'bar' && selectedBarId != null ? selectedBarId : undefined,
  );
  const { data: recipes = [], isLoading: isLoadingRecipes } = useEventRecipes(eventId);
  const { data: allCocktails = [], isLoading: isLoadingCocktails } = useCocktails(false);
  const { data: bars = [] } = useBars(eventId);
  // Filter recipes that are "producto final" (have salePrice > 0)
  const finalRecipes = recipes.filter((r) => r.salePrice > 0);
  
  // Get cocktails that correspond to recipes from this event (by name match)
  const recipeNames = new Set(finalRecipes.map((r) => r.cocktailName.toLowerCase()));
  const eventCocktails = allCocktails.filter((c) => recipeNames.has(c.name.toLowerCase()));

  const createProduct = useCreateProduct(eventId);
  const updateProduct = useUpdateProduct(eventId, editingProduct?.id ?? 0);
  const deleteProduct = useDeleteProduct(eventId);

  const handleOpenDialog = (product?: EventProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductName(product.name);
      setPriceInput((product.price / 100).toFixed(2));
      setSelectedCocktailIds(product.cocktails.map((c) => c.cocktailId));
    } else {
      setEditingProduct(null);
      setProductName('');
      setPriceInput('');
      setSelectedCocktailIds([]);
    }
    setDialogOpen(true);
  };

  const toggleCocktail = (cocktailId: number) => {
    setSelectedCocktailIds((prev) =>
      prev.includes(cocktailId)
        ? prev.filter((id) => id !== cocktailId)
        : [...prev, cocktailId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productName.trim()) {
      toast.error('Ingresa un nombre para el producto');
      return;
    }

    const priceCents = Math.round(parseFloat(priceInput) * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      toast.error('Ingresa un precio válido');
      return;
    }

    if (selectedCocktailIds.length === 0) {
      toast.error('Seleccioná al menos un trago');
      return;
    }

    if (editingProduct) {
      updateProduct.mutate(
        {
          name: productName,
          price: priceCents,
          cocktailIds: selectedCocktailIds,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
          },
        },
      );
    } else {
      const dto = {
        name: productName,
        price: priceCents,
        cocktailIds: selectedCocktailIds,
        ...(scope === 'bar' && selectedBarId != null ? { barId: selectedBarId } : {}),
      };
      createProduct.mutate(dto, {
        onSuccess: () => {
          setDialogOpen(false);
        },
      });
    }
  };

  const handleDelete = (productId: number) => {
    if (confirm('Estás seguro de eliminar este producto?')) {
      deleteProduct.mutate(productId);
    }
  };

  // Get recipe details for a product
  const getRecipeForProduct = (productName: string) => {
    return recipes.find(
      (r) => r.cocktailName.toLowerCase() === productName.toLowerCase()
    );
  };

  const barTypeLabels: Record<string, string> = {
    VIP: 'VIP',
    general: 'General',
    backstage: 'Backstage',
    lounge: 'Lounge',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Los productos se crean automáticamente cuando marcás una receta como "producto final" en la pestaña <strong className="text-foreground">Recetas</strong>.
          Desde acá podés crear combos o productos con nombres personalizados.
        </p>
      </div>
      
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos
          </CardTitle>
          {isEditable && eventCocktails.length > 0 && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Combo
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <Tabs value={scope} onValueChange={(v) => {
            const newScope = v as 'event' | 'bar';
            setScope(newScope);
            if (newScope === 'event') setSelectedBarId(null);
          }}>
            <TabsList>
              <TabsTrigger value="event">Productos del Evento</TabsTrigger>
              <TabsTrigger value="bar">Productos por Barra</TabsTrigger>
            </TabsList>
          </Tabs>
          {scope === 'bar' && (
            <Select
              value={selectedBarId?.toString() ?? ''}
              onValueChange={(v) => setSelectedBarId(parseInt(v, 10))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecciona una barra" />
              </SelectTrigger>
              <SelectContent>
                {bars.map((bar) => (
                  <SelectItem key={bar.id} value={bar.id.toString()}>
                    {bar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {scope === 'bar' && selectedBarId == null ? (
          <div className="text-center py-8 text-muted-foreground">
            {bars.length === 0 
              ? 'Este evento no tiene barras. Creá barras primero en la pestaña "Barras".'
              : 'Selecciona una barra para ver sus productos.'}
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay productos {scope === 'bar' && selectedBarId ? 'para esta barra' : 'del evento'}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const recipe = getRecipeForProduct(product.name);
              const totalPercentage = recipe
                ? recipe.components.reduce((sum, c) => sum + c.percentage, 0)
                : 0;

              return (
                <Card key={product.id} className="rounded-xl flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{product.name}</CardTitle>
                      <Badge variant="default" className="gap-1 shrink-0">
                        {formatPrice(product.price)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {recipe && (
                        <>
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
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    {/* Components with progress bars */}
                    {recipe && (
                      <div className="space-y-1.5">
                        {recipe.components.map((component) => (
                          <div
                            key={component.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-muted-foreground truncate mr-2">
                              {component.drink?.name || `Insumo ${component.drinkId}`}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
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
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
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
                    )}

                    {/* Bar types */}
                    {recipe && recipe.barTypes.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-auto pt-3 border-t mt-3">
                        <span className="text-xs text-muted-foreground">Barras:</span>
                        {recipe.barTypes.map((bt) => (
                          <Badge key={bt} variant="outline" className="text-xs py-0">
                            {barTypeLabels[bt] || bt}
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
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? 'Modifica los datos del producto'
                  : 'Crea un producto nuevo (combo o con nombre personalizado) a partir de las recetas del evento'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Combo Coca + Sprite, Promo 2x1"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Podés usar nombres personalizados como "Combo VIP" o "Promo Hora Feliz"
                  </p>
                </div>
                <div>
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Recetas disponibles</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Selecciona una o más recetas marcadas como "producto final". Si seleccionas más de una, se creará un combo.
                  </p>
                  {isLoadingCocktails || isLoadingRecipes ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : eventCocktails.length === 0 ? (
                    <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground">
                      <p>No hay recetas marcadas como "producto final".</p>
                      <p className="mt-1">
                        Andá a la pestaña <strong>Recetas</strong> y configurá como "producto final" las recetas que quieras vender.
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                      {eventCocktails.map((cocktail) => {
                        const recipe = finalRecipes.find(
                          (r) => r.cocktailName.toLowerCase() === cocktail.name.toLowerCase()
                        );
                        return (
                          <div key={cocktail.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cocktail-${cocktail.id}`}
                              checked={selectedCocktailIds.includes(cocktail.id)}
                              onCheckedChange={() => toggleCocktail(cocktail.id)}
                            />
                            <label
                              htmlFor={`cocktail-${cocktail.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {cocktail.name}
                              <span className="text-muted-foreground ml-2">
                                ({formatPrice(recipe?.salePrice ?? 0)})
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {selectedCocktailIds.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      {selectedCocktailIds.length === 1
                        ? 'Producto individual seleccionado'
                        : `Combo con ${selectedCocktailIds.length} recetas seleccionadas`}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createProduct.isPending ||
                    updateProduct.isPending ||
                    selectedCocktailIds.length === 0
                  }
                >
                  {editingProduct ? 'Guardar' : 'Crear Producto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </div>
  );
}
