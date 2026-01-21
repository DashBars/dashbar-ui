import { useState, useEffect } from 'react';
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
import {
  useCreateManagerInventory,
  useUpdateManagerInventory,
} from '@/hooks/useManagerInventory';
import { useDrinks } from '@/hooks/useDrinks';
import { useSuppliers } from '@/hooks/useSuppliers';
import type {
  ManagerInventory,
  CreateManagerInventoryDto,
  UpdateManagerInventoryDto,
} from '@/lib/api/types';
import { Loader2 } from 'lucide-react';

interface InventoryFormDialogProps {
  inventory?: ManagerInventory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryFormDialog({
  inventory,
  open,
  onOpenChange,
}: InventoryFormDialogProps) {
  const isEdit = !!inventory;
  const { mutate: createInventory, isPending: isCreating } =
    useCreateManagerInventory();
  const { mutate: updateInventory, isPending: isUpdating } =
    useUpdateManagerInventory(inventory?.id || 0);

  const { data: drinks = [], isLoading: isLoadingDrinks } = useDrinks();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();

  const [drinkId, setDrinkId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [totalQuantity, setTotalQuantity] = useState<string>('');
  const [unitCost, setUnitCost] = useState<string>('');
  const [sku, setSku] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (isEdit && inventory) {
        setDrinkId(inventory.drinkId.toString());
        setSupplierId(inventory.supplierId.toString());
        setTotalQuantity(inventory.totalQuantity.toString());
        setUnitCost(inventory.unitCost.toString());
        setSku(inventory.sku || '');
      } else {
        setDrinkId('');
        setSupplierId('');
        setTotalQuantity('');
        setUnitCost('');
        setSku('');
      }
    }
  }, [open, inventory, isEdit]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEdit) {
      const dto: UpdateManagerInventoryDto = {
        totalQuantity: totalQuantity ? parseInt(totalQuantity, 10) : undefined,
        unitCost: unitCost ? parseInt(unitCost, 10) : undefined,
        sku: sku || undefined,
      };
      updateInventory(dto, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      const dto: CreateManagerInventoryDto = {
        drinkId: parseInt(drinkId, 10),
        supplierId: parseInt(supplierId, 10),
        totalQuantity: parseInt(totalQuantity, 10),
        unitCost: parseInt(unitCost, 10),
        currency: 'ARS',
        sku: sku || undefined,
      };
      createInventory(dto, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isSubmitting = isCreating || isUpdating;
  const selectedDrink = drinks.find((d) => d.id.toString() === drinkId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Insumo' : 'Nuevo Insumo'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza la información del insumo.'
              : 'Agrega un nuevo insumo a tu inventario global.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {!isEdit && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="drinkId">
                    Bebida <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={drinkId}
                    onValueChange={setDrinkId}
                    disabled={isSubmitting || isLoadingDrinks}
                  >
                    <SelectTrigger id="drinkId">
                      <SelectValue placeholder="Seleccionar bebida" />
                    </SelectTrigger>
                    <SelectContent>
                      {drinks.map((drink) => (
                        <SelectItem key={drink.id} value={drink.id.toString()}>
                          {drink.name} - {drink.brand} ({drink.volume}ml)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDrink && (
                    <p className="text-xs text-muted-foreground">
                      Marca: {selectedDrink.brand} | Volumen: {selectedDrink.volume}ml | SKU: {selectedDrink.sku}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierId">
                    Proveedor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={supplierId}
                    onValueChange={setSupplierId}
                    disabled={isSubmitting || isLoadingSuppliers}
                  >
                    <SelectTrigger id="supplierId">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="totalQuantity">
                Cantidad Total <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalQuantity"
                type="number"
                min="1"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">
                Costo Unitario (centavos) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="5000"
              />
              <p className="text-xs text-muted-foreground">
                Ejemplo: 5000 = $50.00 ARS
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU del Proveedor</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={isSubmitting}
                placeholder="SKU-12345"
              />
              <p className="text-xs text-muted-foreground text-xs">
                Opcional. Puede diferir del SKU de la bebida.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                isEdit ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
