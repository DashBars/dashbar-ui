import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useBulkUpsertStock } from '@/hooks/useStock';
import type { UpsertStockDto, OwnershipMode } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StockAdjustDialogProps {
  eventId: number;
  barId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockAdjustDialog({
  eventId,
  barId,
  open,
  onOpenChange,
}: StockAdjustDialogProps) {
  const bulkUpsertStock = useBulkUpsertStock(eventId, barId);
  const [items, setItems] = useState<UpsertStockDto[]>([
    {
      drinkId: 0,
      supplierId: 0,
      quantity: 0,
      unitCost: 0,
      currency: 'ARS',
      ownershipMode: 'purchased',
    },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        drinkId: 0,
        supplierId: 0,
        quantity: 0,
        unitCost: 0,
        currency: 'ARS',
        ownershipMode: 'purchased',
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof UpsertStockDto, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(
      (item) => item.drinkId > 0 && item.supplierId > 0 && item.quantity > 0
    );
    if (validItems.length === 0) {
      return;
    }
    bulkUpsertStock.mutate(
      { items: validItems },
      {
        onSuccess: () => {
          setItems([
            {
              drinkId: 0,
              supplierId: 0,
              quantity: 0,
              unitCost: 0,
              currency: 'ARS',
              ownershipMode: 'purchased',
            },
          ]);
          onOpenChange(false);
        },
      }
    );
  };

  const totalCost = items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              Agregá o actualizá items de stock para esta barra. Podés agregar varios a la vez.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {items.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Item {index + 1}</CardTitle>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`drinkId-${index}`}>ID del Insumo</Label>
                      <Input
                        id={`drinkId-${index}`}
                        type="number"
                        min="1"
                        value={item.drinkId || ''}
                        onChange={(e) =>
                          updateItem(index, 'drinkId', parseInt(e.target.value) || 0)
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`supplierId-${index}`}>ID del Proveedor</Label>
                      <Input
                        id={`supplierId-${index}`}
                        type="number"
                        min="1"
                        value={item.supplierId || ''}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'supplierId',
                            parseInt(e.target.value) || 0
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`quantity-${index}`}>Cantidad</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 0
                          )
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`unitCost-${index}`}>Costo Unitario (centavos)</Label>
                      <Input
                        id={`unitCost-${index}`}
                        type="number"
                        min="0"
                        value={item.unitCost || ''}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'unitCost',
                            parseInt(e.target.value) || 0
                          )
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`currency-${index}`}>Moneda</Label>
                      <Input
                        id={`currency-${index}`}
                        value={item.currency || 'ARS'}
                        onChange={(e) =>
                          updateItem(index, 'currency', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`ownershipMode-${index}`}>
                      Tipo de Propiedad
                    </Label>
                    <Select
                      value={item.ownershipMode}
                      onValueChange={(value) =>
                        updateItem(index, 'ownershipMode', value as OwnershipMode)
                      }
                    >
                      <SelectTrigger id={`ownershipMode-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchased">Comprado</SelectItem>
                        <SelectItem value="consignment">Consignación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar otro item
            </Button>
            {totalCost > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vista previa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costo Total:</span>
                      <span className="font-medium">
                        ARS {totalCost / 100}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={bulkUpsertStock.isPending}>
              Guardar Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
