import { useState, useEffect, useRef, useMemo } from 'react';
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
  useGlobalInventory,
} from '@/hooks/useGlobalInventory';
import { useDrinks } from '@/hooks/useDrinks';
import { useSuppliers } from '@/hooks/useSuppliers';
import type {
  GlobalInventory,
  CreateGlobalInventoryDto,
  UpdateGlobalInventoryDto,
  OwnershipMode,
} from '@/lib/api/types';
import { Loader2, PackagePlus, Info } from 'lucide-react';

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
  const { data: allInventory = [] } = useGlobalInventory();

  const { data: drinks = [], isLoading: isLoadingDrinks } = useDrinks();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();

  const [drinkId, setDrinkId] = useState<string>('');
  const [drinkSearch, setDrinkSearch] = useState('');
  const [showDrinkSuggestions, setShowDrinkSuggestions] = useState(false);
  const drinkInputRef = useRef<HTMLInputElement>(null);
  const drinkSuggestionsRef = useRef<HTMLDivElement>(null);

  const [supplierId, setSupplierId] = useState<string>('none');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const supplierSuggestionsRef = useRef<HTMLDivElement>(null);

  const [totalQuantity, setTotalQuantity] = useState<string>('');
  const [unitCost, setUnitCost] = useState<string>('');
  const [currency, setCurrency] = useState<string>('ARS');
  const [sku, setSku] = useState<string>('');
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('purchased');

  const filteredDrinks = useMemo(() => {
    if (!drinkSearch.trim()) return drinks.slice(0, 10);
    const q = drinkSearch.toLowerCase();
    return drinks.filter(
      (d) => d.name.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q) || d.sku.toLowerCase().includes(q),
    ).slice(0, 10);
  }, [drinkSearch, drinks]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [supplierSearch, suppliers]);

  // Detect existing inventory entry for the selected drink+supplier combo
  const existingEntry = useMemo(() => {
    if (isEdit || !drinkId) return null;
    const dId = parseInt(drinkId, 10);
    if (isNaN(dId)) return null;
    const sId = supplierId !== 'none' ? parseInt(supplierId, 10) : null;
    return allInventory.find(
      (inv) => inv.drinkId === dId && (sId === null ? inv.supplierId === null : inv.supplierId === sId),
    ) || null;
  }, [isEdit, drinkId, supplierId, allInventory]);

  // Dynamic update hook for restocking existing entry
  const { mutate: restockInventory, isPending: isRestocking } =
    useUpdateGlobalInventory(existingEntry?.id || 0);

  // Auto-fill currency (but NOT cost) when existing entry is detected
  useEffect(() => {
    if (existingEntry && !isEdit) {
      setCurrency(existingEntry.currency || 'ARS');
    }
  }, [existingEntry, isEdit]);

  // Weighted average cost calculation for restocking
  const weightedAvgCost = useMemo(() => {
    if (!existingEntry || isEdit) return null;
    const additionalQty = parseInt(totalQuantity, 10);
    const newCost = parseFloat(unitCost);
    if (!additionalQty || additionalQty <= 0 || !newCost || newCost <= 0) return null;
    const existingCostPerUnit = existingEntry.unitCost / 100; // from cents to display
    const existingQty = existingEntry.totalQuantity;
    const avg =
      (existingQty * existingCostPerUnit + additionalQty * newCost) /
      (existingQty + additionalQty);
    return avg;
  }, [existingEntry, isEdit, totalQuantity, unitCost]);

  const costChanged = useMemo(() => {
    if (!existingEntry || isEdit) return false;
    const newCost = parseFloat(unitCost);
    if (!newCost || newCost <= 0) return false;
    const existingCostPerUnit = existingEntry.unitCost / 100;
    return Math.abs(newCost - existingCostPerUnit) > 0.001;
  }, [existingEntry, isEdit, unitCost]);

  useEffect(() => {
    if (open) {
      if (isEdit && inventory) {
        setDrinkId(inventory.drinkId.toString());
        const existingDrink = drinks.find((d) => d.id === inventory.drinkId);
        setDrinkSearch(existingDrink ? `${existingDrink.name} - ${existingDrink.brand} (${existingDrink.volume}ml)` : '');
        setSupplierId(inventory.supplierId ? inventory.supplierId.toString() : 'none');
        const existingSupplier = suppliers.find((s) => s.id === inventory.supplierId);
        setSupplierSearch(existingSupplier ? existingSupplier.name : '');
        setTotalQuantity(inventory.totalQuantity.toString());
        setUnitCost((inventory.unitCost / 100).toFixed(2));
        setCurrency(inventory.currency || 'ARS');
        setSku(inventory.sku || '');
        setOwnershipMode(inventory.ownershipMode);
      } else {
        setDrinkId('');
        setDrinkSearch('');
        setSupplierId('none');
        setSupplierSearch('');
        setTotalQuantity('');
        setUnitCost('');
        setCurrency('ARS');
        setSku('');
        setOwnershipMode('purchased');
      }
      setShowDrinkSuggestions(false);
      setShowSupplierSuggestions(false);
    }
  }, [open, inventory, isEdit, drinks, suppliers]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        drinkSuggestionsRef.current && !drinkSuggestionsRef.current.contains(e.target as Node) &&
        drinkInputRef.current && !drinkInputRef.current.contains(e.target as Node)
      ) {
        setShowDrinkSuggestions(false);
      }
      if (
        supplierSuggestionsRef.current && !supplierSuggestionsRef.current.contains(e.target as Node) &&
        supplierInputRef.current && !supplierInputRef.current.contains(e.target as Node)
      ) {
        setShowSupplierSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
    } else if (existingEntry) {
      // Restock: increment totalQuantity and compute weighted average cost
      const additionalQty = parseInt(totalQuantity, 10);
      const finalCost = weightedAvgCost != null
        ? Math.round(weightedAvgCost * 100)
        : unitCost
          ? Math.round(parseFloat(unitCost) * 100)
          : undefined;
      const dto: UpdateGlobalInventoryDto = {
        totalQuantity: existingEntry.totalQuantity + additionalQty,
        unitCost: finalCost,
        currency: currency || undefined,
      };
      restockInventory(dto, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      const dto: CreateGlobalInventoryDto = {
        drinkId: parseInt(drinkId, 10),
        supplierId: supplierId !== 'none' ? parseInt(supplierId, 10) : undefined,
        totalQuantity: parseInt(totalQuantity, 10),
        unitCost: Math.round(parseFloat(unitCost) * 100),
        currency: currency,
        sku: sku || undefined,
        ownershipMode: ownershipMode,
      };
      createInventory(dto, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isSubmitting = isCreating || isUpdating || isRestocking;
  const selectedDrink = drinks.find((d) => d.id.toString() === drinkId);
  const canSubmit = isEdit || (!!drinkId && drinkId !== '' && !isNaN(parseInt(drinkId, 10)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Stock' : existingEntry ? 'Reabastecer Stock' : 'Agregar Stock'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza la cantidad o costo del stock.'
              : existingEntry
                ? 'Ya tenés este insumo en el inventario. Agregá más unidades al stock existente.'
                : 'Registra una compra de insumos. Selecciona un insumo previamente creado y el proveedor del cual lo compraste.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            {!isEdit && (
              <>
                <div className="space-y-2 relative">
                  <Label htmlFor="drinkSearch">
                    Insumo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={drinkInputRef}
                    id="drinkSearch"
                    value={drinkSearch}
                    onChange={(e) => {
                      setDrinkSearch(e.target.value);
                      setDrinkId('');
                      setShowDrinkSuggestions(true);
                    }}
                    onFocus={() => setShowDrinkSuggestions(true)}
                    placeholder="Buscar insumo por nombre, marca o SKU..."
                    autoComplete="off"
                    disabled={isSubmitting || isLoadingDrinks}
                  />
                  {showDrinkSuggestions && filteredDrinks.length > 0 && (
                    <div
                      ref={drinkSuggestionsRef}
                      className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto"
                    >
                      {filteredDrinks.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between gap-2 text-sm ${drinkId === d.id.toString() ? 'bg-accent' : ''}`}
                          onClick={() => {
                            setDrinkId(d.id.toString());
                            setDrinkSearch(`${d.name} - ${d.brand} (${d.volume}ml)`);
                            setShowDrinkSuggestions(false);
                          }}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{d.name}</span>
                            <span className="text-xs text-muted-foreground truncate">{d.brand} | SKU: {d.sku}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                            <span>{d.volume}ml</span>
                            <span className="rounded bg-muted px-1.5 py-0.5">
                              {d.drinkType === 'alcoholic' ? 'Alc' : 'S/A'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedDrink ? (
                    <p className="text-xs text-muted-foreground">
                      Marca: {selectedDrink.brand} | Volumen: {selectedDrink.volume}ml | SKU: {selectedDrink.sku}
                    </p>
                  ) : drinkSearch.trim() && !drinkId ? (
                    <p className="text-xs text-destructive">
                      Seleccioná un insumo de la lista desplegable
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="supplierSearch">Proveedor</Label>
                  <Input
                    ref={supplierInputRef}
                    id="supplierSearch"
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setSupplierId('none');
                      setShowSupplierSuggestions(true);
                    }}
                    onFocus={() => setShowSupplierSuggestions(true)}
                    placeholder="Buscar proveedor..."
                    autoComplete="off"
                    disabled={isSubmitting || isLoadingSuppliers}
                  />
                  {showSupplierSuggestions && (
                    <div
                      ref={supplierSuggestionsRef}
                      className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md max-h-44 overflow-y-auto"
                    >
                      <button
                        type="button"
                        className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors text-sm text-muted-foreground ${supplierId === 'none' && !supplierSearch.trim() ? 'bg-accent' : ''}`}
                        onClick={() => {
                          setSupplierId('none');
                          setSupplierSearch('');
                          setShowSupplierSuggestions(false);
                        }}
                      >
                        Sin proveedor
                      </button>
                      {filteredSuppliers.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors text-sm ${supplierId === s.id.toString() ? 'bg-accent' : ''}`}
                          onClick={() => {
                            setSupplierId(s.id.toString());
                            setSupplierSearch(s.name);
                            setShowSupplierSuggestions(false);
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Opcional. Puedes agregar stock sin asociarlo a un proveedor.
                  </p>
                </div>
              </>
            )}
            {/* Restock banner — shown when existing entry is detected */}
            {!isEdit && existingEntry && (
              <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-3 py-2.5">
                <PackagePlus className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-medium">Stock existente encontrado</p>
                  <p className="text-xs leading-relaxed">
                    Ya tenés <strong>{existingEntry.totalQuantity} unidades</strong> de este insumo
                    {existingEntry.supplier ? ` (${existingEntry.supplier.name})` : ''}
                    {existingEntry.allocatedQuantity > 0 && (
                      <>, de las cuales <strong>{existingEntry.allocatedQuantity}</strong> ya están asignadas a barras</>
                    )}.
                    Las unidades que agregues se sumarán al total existente.
                  </p>
                </div>
              </div>
            )}
            {!isEdit && !existingEntry && (
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
                {existingEntry ? 'Cantidad a agregar' : 'Cantidad'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalQuantity"
                type="number"
                min="1"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder={existingEntry ? 'Ej: 20' : '40'}
              />
              <p className="text-xs text-muted-foreground">
                {existingEntry
                  ? `Unidades adicionales a sumar (total quedará en ${existingEntry.totalQuantity + (parseInt(totalQuantity, 10) || 0)})`
                  : 'Cantidad de unidades compradas'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitCost">
                  {existingEntry ? 'Costo unitario nuevo' : 'Costo Unitario'} <span className="text-destructive">*</span>
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
            {existingEntry ? (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Costo unitario del lote anterior: <strong>${(existingEntry.unitCost / 100).toFixed(2)}</strong>. Ingresá el costo de esta nueva compra.
                </p>
                {costChanged && weightedAvgCost != null && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                    <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-300 space-y-0.5">
                      <p className="font-medium">El costo cambió respecto al lote anterior</p>
                      <p>
                        Lote anterior: {existingEntry.totalQuantity} uds × ${(existingEntry.unitCost / 100).toFixed(2)}
                      </p>
                      <p>
                        Nuevo lote: {parseInt(totalQuantity, 10) || 0} uds × ${parseFloat(unitCost || '0').toFixed(2)}
                      </p>
                      <p className="font-semibold">
                        Costo promedio ponderado resultante: ${weightedAvgCost.toFixed(2)}
                      </p>
                      <p className="text-[10px] leading-snug opacity-80">
                        El costo del stock ya asignado a barras no se modifica. Solo se actualiza el costo de referencia del inventario global.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ingresá el costo unitario (ej: 50.00 para $50.00)
              </p>
            )}
            {!existingEntry && (
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
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Actualizando...' : existingEntry ? 'Reabasteciendo...' : 'Agregando...'}
                </>
              ) : (
                isEdit ? 'Actualizar' : existingEntry ? 'Reabastecer Stock' : 'Agregar Stock'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
