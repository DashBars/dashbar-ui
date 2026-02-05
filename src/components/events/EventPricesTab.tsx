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
import { useEventPrices, useCreatePrice, useUpdatePrice, useDeletePrice } from '@/hooks/usePrices';
import { useCocktails } from '@/hooks/useCocktails';
import { useBars } from '@/hooks/useBars';
import { Skeleton } from '@/components/ui/skeleton';
import type { EventPrice } from '@/lib/api/types';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface EventPricesTabProps {
  eventId: number;
  isEditable: boolean;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function EventPricesTab({ eventId, isEditable }: EventPricesTabProps) {
  const [scope, setScope] = useState<'event' | 'bar'>('event');
  const [selectedBarId, setSelectedBarId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<EventPrice | null>(null);
  const [cocktailId, setCocktailId] = useState<string>('');
  const [priceInput, setPriceInput] = useState('');

  const { data: prices = [], isLoading } = useEventPrices(
    eventId,
    scope === 'bar' && selectedBarId != null ? selectedBarId : undefined,
  );
  const { data: cocktails = [], isLoading: isLoadingCocktails } = useCocktails(false);
  const { data: bars = [] } = useBars(eventId);

  const createPrice = useCreatePrice(eventId);
  const updatePrice = useUpdatePrice(eventId, editingPrice?.id ?? 0);
  const deletePrice = useDeletePrice(eventId);

  const handleOpenDialog = (price?: EventPrice) => {
    if (price) {
      setEditingPrice(price);
      setCocktailId(price.cocktailId.toString());
      setPriceInput((price.price / 100).toFixed(2));
    } else {
      setEditingPrice(null);
      setCocktailId('');
      setPriceInput('');
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(priceInput) * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      toast.error('Ingresa un precio válido');
      return;
    }
    const cid = parseInt(cocktailId, 10);
    if (!cocktailId || Number.isNaN(cid)) {
      toast.error('Selecciona un producto');
      return;
    }
    if (editingPrice) {
      updatePrice.mutate(
        { price: priceCents },
        {
          onSuccess: () => {
            setDialogOpen(false);
          },
        },
      );
    } else {
      const dto = {
        cocktailId: cid,
        price: priceCents,
        ...(scope === 'bar' && selectedBarId != null ? { barId: selectedBarId } : {}),
      };
      createPrice.mutate(dto, {
        onSuccess: () => {
          setDialogOpen(false);
        },
      });
    }
  };

  const handleDelete = (price: EventPrice) => {
    if (!confirm(`¿Eliminar precio de ${price.cocktail?.name ?? price.cocktailId}?`)) return;
    deletePrice.mutate(price.id);
  };

  const cocktailName = (id: number) =>
    cocktails.find((c) => c.id === id)?.name ?? `Producto #${id}`;

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Precios y catálogo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Precios por defecto del evento y overrides por barra. El POS usa el precio de la barra
            si existe; si no, el del evento.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Vista:</Label>
              <Select
                value={scope}
                onValueChange={(v) => {
                  setScope(v as 'event' | 'bar');
                  if (v === 'event') setSelectedBarId(null);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Precios del evento</SelectItem>
                  <SelectItem value="bar">Precios por barra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scope === 'bar' && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Barra:</Label>
                <Select
                  value={selectedBarId?.toString() ?? ''}
                  onValueChange={(v) => setSelectedBarId(v ? parseInt(v, 10) : null)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar barra" />
                  </SelectTrigger>
                  <SelectContent>
                    {bars.map((bar) => (
                      <SelectItem key={bar.id} value={bar.id.toString()}>
                        {bar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={() => handleOpenDialog()}
              disabled={
                !isEditable || (scope === 'bar' && selectedBarId == null)
              }
              title={
                !isEditable
                  ? 'Los precios no se pueden modificar una vez iniciado el evento'
                  : scope === 'bar' && selectedBarId == null
                    ? 'Selecciona una barra'
                    : undefined
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              {scope === 'bar' && selectedBarId != null
                ? 'Agregar precio para esta barra'
                : 'Agregar precio del evento'}
            </Button>
          </div>

          {isLoading || isLoadingCocktails ? (
            <Skeleton className="h-48 w-full" />
          ) : prices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {scope === 'bar' && selectedBarId != null
                ? 'No hay precios específicos para esta barra. Se usan los precios del evento.'
                : 'No hay precios configurados para este evento. Agrega precios para los productos a la venta.'}
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.cocktail?.name ?? cocktailName(p.cocktailId)}
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(p.price)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(p)}
                            disabled={!isEditable}
                            title={
                              !isEditable
                                ? 'Los precios no se pueden modificar una vez iniciado el evento'
                                : 'Editar precio'
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(p)}
                            disabled={!isEditable}
                            title={
                              !isEditable
                                ? 'Los precios no se pueden modificar una vez iniciado el evento'
                                : 'Eliminar precio'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPrice ? 'Editar precio' : scope === 'bar' ? 'Precio para esta barra' : 'Precio del evento'}
              </DialogTitle>
              <DialogDescription>
                {editingPrice
                  ? 'Modifica el precio en centavos o dólares.'
                  : 'Elige un producto y define su precio de venta.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingPrice && (
                <div className="grid gap-2">
                  <Label>Producto</Label>
                  <Select value={cocktailId} onValueChange={setCocktailId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {(scope === 'event'
                        ? cocktails.filter((c) => !prices.some((p) => p.cocktailId === c.id))
                        : cocktails
                      ).map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                      {scope === 'event' &&
                        cocktails.filter((c) => !prices.some((p) => p.cocktailId === c.id))
                          .length === 0 && (
                        <SelectItem value="" disabled>
                          Todos los productos ya tienen precio en el evento
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="price">Precio ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  required
                  placeholder="Ej: 15.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createPrice.isPending ||
                  updatePrice.isPending ||
                  (!editingPrice && !cocktailId)
                }
              >
                {editingPrice ? 'Actualizar' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
