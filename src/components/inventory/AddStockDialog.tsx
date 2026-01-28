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
  useCreateGlobalInventory,
  useUpdateGlobalInventory,
} from '@/hooks/useGlobalInventory';
import { useDrinks } from '@/hooks/useDrinks';
import { useSuppliers } from '@/hooks/useSuppliers';
import type {
  GlobalInventory,
  CreateGlobalInventoryDto,
  UpdateGlobalInventoryDto,
  OwnershipMode,
} from '@/lib/api/types';
import { Loader2 } from 'lucide-react';

interface AddStockDialogProps {
  inventory?: GlobalInventory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStockDialog({
  inventory,
  open,
  onOpenChange,
}: AddStockDialogProps) {
  const isEdit = !!inventory;
  const { mutate: createInventory, isPending: isCreating } =
    useCreateGlobalInventory();
  const { mutate: updateInventory, isPending: isUpdating } =
    useUpdateGlobalInventory(inventory?.id || 0);

  const { data: drinks = [], isLoading: isLoadingDrinks } = useDrinks();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();

  const [drinkId, setDrinkId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('none');
  const [totalQuantity, setTotalQuantity] = useState<string>('');
  const [unitCost, setUnitCost] = useState<string>('');
  const [currency, setCurrency] = useState<string>('ARS');
  const [sku, setSku] = useState<string>('');
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('purchased');

  useEffect(() => {
    if (open) {
      if (isEdit && inventory) {
        setDrinkId(inventory.drinkId.toString());
        setSupplierId(inventory.supplierId ? inventory.supplierId.toString() : 'none');
        setTotalQuantity(inventory.totalQuantity.toString());
        setUnitCost((inventory.unitCost / 100).toFixed(2)); // Convertir de centavos a unidades
        setCurrency(inventory.currency || 'ARS');
        setSku(inventory.sku || '');
        setOwnershipMode(inventory.ownershipMode);
      } else {
        setDrinkId('');
        setSupplierId('none');
        setTotalQuantity('');
        setUnitCost('');
        setCurrency('ARS');
        setSku('');
        setOwnershipMode('purchased');
      }
    }
  }, [open, inventory, isEdit]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEdit) {
      const dto: UpdateGlobalInventoryDto = {
        totalQuantity: totalQuantity ? parseInt(totalQuantity, 10) : undefined,
        unitCost: unitCost ? Math.round(parseFloat(unitCost) * 100) : undefined, // Convertir a centavos
        currency: currency || undefined,
        sku: sku || undefined,
        ownershipMode: ownershipMode,
      };
      updateInventory(dto, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      const dto: CreateGlobalInventoryDto = {
        drinkId: parseInt(drinkId, 10),
        supplierId: supplierId !== 'none' ? parseInt(supplierId, 10) : undefined,
        totalQuantity: parseInt(totalQuantity, 10),
        unitCost: Math.round(parseFloat(unitCost) * 100), // Convertir a centavos para almacenar
        currency: currency,
        sku: sku || undefined,
        ownershipMode: ownershipMode,
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
            {isEdit ? 'Editar Stock' : 'Agregar Stock'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza la cantidad o costo del stock.'
              : 'Registra una compra de insumos. Selecciona un insumo previamente creado y el proveedor del cual lo compraste.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {!isEdit && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="drinkId">
                    Insumo <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={drinkId}
                    onValueChange={setDrinkId}
                    disabled={isSubmitting || isLoadingDrinks}
                  >
                    <SelectTrigger id="drinkId">
                      <SelectValue placeholder="Seleccionar insumo" />
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
                  <Label htmlFor="supplierId">Proveedor</Label>
                  <Select
                    value={supplierId}
                    onValueChange={setSupplierId}
                    disabled={isSubmitting || isLoadingSuppliers}
                  >
                    <SelectTrigger id="supplierId">
                      <SelectValue placeholder="Seleccionar proveedor (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proveedor</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Opcional. Puedes agregar stock sin asociarlo a un proveedor.
                  </p>
                </div>
              </>
            )}
            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="ownershipMode">Tipo de Propiedad</Label>
                <Select
                  value={ownershipMode}
                  onValueChange={(value) => setOwnershipMode(value as OwnershipMode)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="ownershipMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchased">Comprado</SelectItem>
                    <SelectItem value="consignment">Consignación</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  "Comprado" significa que ya pagaste por el stock. "Consignación" significa que el proveedor te lo prestó y deberás devolverlo.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="totalQuantity">
                Cantidad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalQuantity"
                type="number"
                min="1"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="40"
              />
              <p className="text-xs text-muted-foreground">
                Cantidad de unidades compradas
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitCost">
                  Costo Unitario <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="50.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">
                  Moneda <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS (Peso Argentino)</SelectItem>
                    <SelectItem value="USD">USD (Dólar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresa el costo unitario en unidades (ej: 50.00 para $50.00)
            </p>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU del Insumo</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={isSubmitting}
                placeholder="SKU-12345"
              />
              <p className="text-xs text-muted-foreground">
                Opcional. SKU del insumo en tu inventario.
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
                  {isEdit ? 'Actualizando...' : 'Agregando...'}
                </>
              ) : (
                isEdit ? 'Actualizar' : 'Agregar Stock'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
