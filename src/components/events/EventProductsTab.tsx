import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useEventProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct 
} from '@/hooks/useProducts';
import { useCocktails } from '@/hooks/useCocktails';
import { useBars } from '@/hooks/useBars';
import { Skeleton } from '@/components/ui/skeleton';
import type { EventProduct } from '@/lib/api/types';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

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

  const { data: products = [], isLoading } = useEventProducts(
    eventId,
    scope === 'bar' && selectedBarId != null ? selectedBarId : undefined,
  );
  const { data: cocktails = [], isLoading: isLoadingCocktails } = useCocktails(false);
  const { data: bars = [] } = useBars(eventId);

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
      toast.error('Selecciona al menos un cocktail');
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

  const getCocktailNames = (product: EventProduct) => {
    return product.cocktails.map((c) => c.cocktail.name).join(' + ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos
          </CardTitle>
          {isEditable && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          )}
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex gap-2">
            <Button
              variant={scope === 'event' ? 'default' : 'outline'}
              onClick={() => {
                setScope('event');
                setSelectedBarId(null);
              }}
            >
              Productos del Evento
            </Button>
            <Button
              variant={scope === 'bar' ? 'default' : 'outline'}
              onClick={() => setScope('bar')}
            >
              Productos por Barra
            </Button>
          </div>
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
        {isLoading ? (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cocktails</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Precio</TableHead>
                {isEditable && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getCocktailNames(product)}
                  </TableCell>
                  <TableCell>
                    {product.isCombo ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Combo ({product.cocktails.length})
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Individual
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  {isEditable && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                  : 'Crea un producto nuevo con nombre personalizado y múltiples cocktails'}
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
                    Puedes usar nombres personalizados como "Combo VIP" o "Promo Happy Hour"
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
                  <Label>Cocktails</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Selecciona uno o más cocktails. Si seleccionas más de uno, se creará un combo.
                  </p>
                  {isLoadingCocktails ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                      {cocktails.map((cocktail) => (
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
                              ({formatPrice(cocktail.price)})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedCocktailIds.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      {selectedCocktailIds.length === 1
                        ? 'Producto individual seleccionado'
                        : `Combo con ${selectedCocktailIds.length} cocktails seleccionados`}
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
  );
}
