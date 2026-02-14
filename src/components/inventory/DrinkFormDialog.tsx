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
import { Switch } from '@/components/ui/switch';
import { useCreateDrink, useUpdateDrink, useDrinks } from '@/hooks/useDrinks';
import { useCreateGlobalInventory } from '@/hooks/useGlobalInventory';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { Drink, CreateDrinkDto, UpdateDrinkDto, OwnershipMode } from '@/lib/api/types';
import { Loader2, Plus, AlertCircle, Package, Lock, PackagePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DrinkFormDialogProps {
  drink?: Drink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DrinkFormDialog({
  drink,
  open,
  onOpenChange,
}: DrinkFormDialogProps) {
  const isEdit = !!drink;
  const { mutate: createDrink, isPending: isCreating } = useCreateDrink();
  const { mutate: updateDrink, isPending: isUpdating } = useUpdateDrink(
    drink?.id || 0,
  );

  const { data: allDrinks = [] } = useDrinks();
  const { mutate: createInventory, isPending: isCreatingInventory } = useCreateGlobalInventory();
  const { data: suppliers = [] } = useSuppliers();

  // Check if this drink has associations that lock critical fields
  const hasAssociations = useMemo(() => {
    if (!isEdit || !drink?._count) return false;
    const c = drink._count;
    return c.globalInventories > 0 || c.stocks > 0 || c.eventRecipeComponents > 0 || c.inventoryMovements > 0;
  }, [isEdit, drink]);

  // Build a human-readable summary of what's associated
  const associationSummary = useMemo(() => {
    if (!isEdit || !drink?._count) return '';
    const c = drink._count;
    const parts: string[] = [];
    if (c.stocks > 0) parts.push(`${c.stocks} stock en barras`);
    if (c.globalInventories > 0) parts.push(`${c.globalInventories} stock global`);
    if (c.eventRecipeComponents > 0) parts.push(`${c.eventRecipeComponents} recetas`);
    if (c.inventoryMovements > 0) parts.push(`${c.inventoryMovements} movimientos`);
    return parts.join(', ');
  }, [isEdit, drink]);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [drinkType, setDrinkType] = useState<'alcoholic' | 'non_alcoholic'>('non_alcoholic');
  const [volume, setVolume] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Inventory toggle state (create mode only)
  const [addToInventory, setAddToInventory] = useState(false);
  const [invSupplierId, setInvSupplierId] = useState<string>('none');
  const [invSupplierSearch, setInvSupplierSearch] = useState('');
  const [showInvSupplierSuggestions, setShowInvSupplierSuggestions] = useState(false);
  const invSupplierInputRef = useRef<HTMLInputElement>(null);
  const invSupplierSuggestionsRef = useRef<HTMLDivElement>(null);
  const [invQuantity, setInvQuantity] = useState<string>('');
  const [invUnitCost, setInvUnitCost] = useState<string>('');
  const [invCurrency, setInvCurrency] = useState<string>('ARS');
  const [invOwnershipMode, setInvOwnershipMode] = useState<OwnershipMode>('purchased');

  const filteredInvSuppliers = useMemo(() => {
    if (!invSupplierSearch.trim()) return suppliers;
    const q = invSupplierSearch.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [invSupplierSearch, suppliers]);

  const suggestions = useMemo(() => {
    if (!name.trim() || isEdit) return [];
    const q = name.toLowerCase();
    return allDrinks
      .filter((d) => d.name.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q))
      .slice(0, 8);
  }, [name, allDrinks, isEdit]);

  // Existing variants: drinks with same name+brand (excluding self when editing)
  const existingVariants = useMemo(() => {
    if (!name.trim() || !brand.trim()) return [];
    return allDrinks.filter(
      (d) =>
        d.name.toLowerCase() === name.toLowerCase().trim() &&
        d.brand.toLowerCase() === brand.toLowerCase().trim() &&
        (!isEdit || d.id !== drink?.id),
    );
  }, [name, brand, allDrinks, isEdit, drink?.id]);

  // Duplicate check: same name + brand + volume + type already exists (excluding self when editing)
  const isDuplicate = useMemo(() => {
    if (!name.trim() || !brand.trim() || !volume) return false;
    const vol = parseInt(volume, 10);
    return allDrinks.some(
      (d) =>
        d.name.toLowerCase() === name.toLowerCase().trim() &&
        d.brand.toLowerCase() === brand.toLowerCase().trim() &&
        d.volume === vol &&
        d.drinkType === drinkType &&
        (!isEdit || d.id !== drink?.id),
    );
  }, [name, brand, volume, drinkType, allDrinks, isEdit, drink?.id]);

  useEffect(() => {
    if (open) {
      if (isEdit && drink) {
        setName(drink.name);
        setBrand(drink.brand);
        setSku(drink.sku);
        setDrinkType(drink.drinkType);
        setVolume(drink.volume.toString());
      } else {
        setName('');
        setBrand('');
        setSku('');
        setDrinkType('non_alcoholic');
        setVolume('');
        // Reset inventory fields
        setAddToInventory(false);
        setInvSupplierId('none');
        setInvSupplierSearch('');
        setInvQuantity('');
        setInvUnitCost('');
        setInvCurrency('ARS');
        setInvOwnershipMode('purchased');
      }
      setShowSuggestions(false);
      setShowInvSupplierSuggestions(false);
    }
  }, [open, drink, isEdit]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        invSupplierSuggestionsRef.current &&
        !invSupplierSuggestionsRef.current.contains(e.target as Node) &&
        invSupplierInputRef.current &&
        !invSupplierInputRef.current.contains(e.target as Node)
      ) {
        setShowInvSupplierSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectSuggestion = (d: Drink) => {
    setName(d.name);
    setBrand(d.brand);
    setDrinkType(d.drinkType);
    // Don't auto-fill SKU and volume - user might want a different bottle size
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEdit) {
      // When there are associations, only SKU can change
      const dto: UpdateDrinkDto = hasAssociations
        ? { sku: sku || undefined }
        : {
            name: name || undefined,
            brand: brand || undefined,
            sku: sku || undefined,
            drinkType: drinkType || undefined,
            volume: volume ? parseInt(volume, 10) : undefined,
          };
      updateDrink(dto, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      const dto: CreateDrinkDto = {
        name,
        brand,
        sku,
        drinkType,
        volume: parseInt(volume, 10),
      };
      createDrink(dto, {
        onSuccess: (newDrink) => {
          if (addToInventory && invQuantity && invUnitCost) {
            createInventory(
              {
                drinkId: newDrink.id,
                supplierId: invSupplierId !== 'none' ? parseInt(invSupplierId, 10) : undefined,
                totalQuantity: parseInt(invQuantity, 10),
                unitCost: Math.round(parseFloat(invUnitCost) * 100),
                currency: invCurrency,
                ownershipMode: invOwnershipMode,
              },
              { onSuccess: () => onOpenChange(false) },
            );
          } else {
            onOpenChange(false);
          }
        },
      });
    }
  };

  const isSubmitting = isCreating || isUpdating || isCreatingInventory;

  // Detect if anything changed from the original drink (for edit mode)
  const hasChanges = useMemo(() => {
    if (!isEdit || !drink) return true; // always enabled for create
    return (
      name !== drink.name ||
      brand !== drink.brand ||
      sku !== drink.sku ||
      drinkType !== drink.drinkType ||
      volume !== drink.volume.toString()
    );
  }, [isEdit, drink, name, brand, sku, drinkType, volume]);

  // Inventory fields valid when toggle is on
  const inventoryFieldsValid = !addToInventory || (
    !!invQuantity && parseInt(invQuantity, 10) > 0 &&
    !!invUnitCost && parseFloat(invUnitCost) >= 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Insumo' : 'Nuevo Insumo'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza la definición del insumo.'
              : 'Define un nuevo insumo (bebida) que podrás usar en tu inventario.'}
          </DialogDescription>
        </DialogHeader>
        {isEdit && hasAssociations && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-700 dark:bg-amber-950/30">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <p className="font-medium">Campos protegidos</p>
              <p className="text-xs mt-0.5">
                Este insumo tiene {associationSummary} asociados.
                Solo podés editar el SKU (referencia interna, no el código de barras del producto).
              </p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2 relative">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                Nombre <span className="text-destructive">*</span>
                {hasAssociations && <Lock className="h-3 w-3 text-amber-500" />}
              </Label>
              <Input
                ref={nameInputRef}
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!isEdit) setShowSuggestions(true);
                }}
                onFocus={() => { if (!isEdit && name.trim()) setShowSuggestions(true); }}
                required
                disabled={isSubmitting || hasAssociations}
                placeholder="Buscar o crear insumo..."
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto"
                >
                  {suggestions.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between gap-2 text-sm"
                      onClick={() => handleSelectSuggestion(d)}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{d.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{d.brand}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
                        <span>{d.volume}ml</span>
                        <span className="text-muted-foreground/50">|</span>
                        <span>{d.sku}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {d.drinkType === 'alcoholic' ? 'Alc' : 'S/A'}
                        </span>
                      </div>
                    </button>
                  ))}
                  {!isDuplicate && name.trim() && (
                    <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      Se creará "{name}" como nuevo insumo
                    </div>
                  )}
                </div>
              )}
              {/* Chips: existing variants of this drink */}
              {existingVariants.length > 0 && !showSuggestions && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {isEdit ? 'Otras presentaciones cargadas:' : 'Ya cargados con este nombre y marca:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {existingVariants.map((v) => (
                      <Badge
                        key={v.id}
                        className="text-xs font-normal gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                      >
                        {v.volume}ml | {v.sku}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand" className="flex items-center gap-1.5">
                Marca <span className="text-destructive">*</span>
                {hasAssociations && <Lock className="h-3 w-3 text-amber-500" />}
              </Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                disabled={isSubmitting || hasAssociations}
                placeholder="Coca Cola Company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="COCA-1250"
              />
              <p className="text-xs text-muted-foreground">
                Código interno del producto
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="drinkType" className="flex items-center gap-1.5">
                Tipo <span className="text-destructive">*</span>
                {hasAssociations && <Lock className="h-3 w-3 text-amber-500" />}
              </Label>
              <Select
                value={drinkType}
                onValueChange={(value: 'alcoholic' | 'non_alcoholic') =>
                  setDrinkType(value)
                }
                disabled={isSubmitting || hasAssociations}
              >
                <SelectTrigger id="drinkType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alcoholic">Alcohólica</SelectItem>
                  <SelectItem value="non_alcoholic">No Alcohólica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume" className="flex items-center gap-1.5">
                Volumen (ml) <span className="text-destructive">*</span>
                {hasAssociations && <Lock className="h-3 w-3 text-amber-500" />}
              </Label>
              <Input
                id="volume"
                type="number"
                min="1"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                required
                disabled={isSubmitting || hasAssociations}
                placeholder="1250"
              />
              <p className="text-xs text-muted-foreground">
                {hasAssociations
                  ? 'No se puede modificar porque hay stock o recetas asociadas.'
                  : 'Ejemplo: 1250 = 1.25 litros'}
              </p>
            </div>

            {/* Add to inventory toggle - create mode only */}
            {!isEdit && (
              <div className="rounded-xl border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackagePlus className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="addToInventory" className="text-sm font-medium cursor-pointer">
                      Cargar al inventario global
                    </Label>
                  </div>
                  <Switch
                    id="addToInventory"
                    checked={addToInventory}
                    onCheckedChange={setAddToInventory}
                    disabled={isSubmitting}
                  />
                </div>
                {addToInventory && (
                  <div className="space-y-3 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Registrá la compra de este insumo directamente.
                    </p>

                    {/* Supplier autocomplete */}
                    <div className="space-y-1.5 relative">
                      <Label htmlFor="invSupplierSearch" className="text-xs">Proveedor</Label>
                      <Input
                        ref={invSupplierInputRef}
                        id="invSupplierSearch"
                        value={invSupplierSearch}
                        onChange={(e) => {
                          setInvSupplierSearch(e.target.value);
                          setInvSupplierId('none');
                          setShowInvSupplierSuggestions(true);
                        }}
                        onFocus={() => setShowInvSupplierSuggestions(true)}
                        placeholder="Buscar proveedor..."
                        autoComplete="off"
                        disabled={isSubmitting}
                        className="h-8 text-sm"
                      />
                      {showInvSupplierSuggestions && (
                        <div
                          ref={invSupplierSuggestionsRef}
                          className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md max-h-36 overflow-y-auto"
                        >
                          <button
                            type="button"
                            className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors text-xs text-muted-foreground"
                            onClick={() => {
                              setInvSupplierId('none');
                              setInvSupplierSearch('');
                              setShowInvSupplierSuggestions(false);
                            }}
                          >
                            Sin proveedor
                          </button>
                          {filteredInvSuppliers.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className={`w-full text-left px-3 py-1.5 hover:bg-accent transition-colors text-xs ${invSupplierId === s.id.toString() ? 'bg-accent' : ''}`}
                              onClick={() => {
                                setInvSupplierId(s.id.toString());
                                setInvSupplierSearch(s.name);
                                setShowInvSupplierSuggestions(false);
                              }}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground">Opcional</p>
                    </div>

                    {/* Ownership mode */}
                    <div className="space-y-1.5">
                      <Label htmlFor="invOwnershipMode" className="text-xs">Tipo de propiedad</Label>
                      <Select
                        value={invOwnershipMode}
                        onValueChange={(v) => setInvOwnershipMode(v as OwnershipMode)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="invOwnershipMode" className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="purchased">Comprado</SelectItem>
                          <SelectItem value="consignment">Consignacion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1.5">
                      <Label htmlFor="invQuantity" className="text-xs">
                        Cantidad <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="invQuantity"
                        type="number"
                        min="1"
                        value={invQuantity}
                        onChange={(e) => setInvQuantity(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="20"
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Unit cost + currency */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="invUnitCost" className="text-xs">
                          Costo unitario <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="invUnitCost"
                          type="number"
                          step="0.01"
                          min="0"
                          value={invUnitCost}
                          onChange={(e) => setInvUnitCost(e.target.value)}
                          disabled={isSubmitting}
                          placeholder="50.00"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="invCurrency" className="text-xs">Moneda</Label>
                        <Select
                          value={invCurrency}
                          onValueChange={setInvCurrency}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id="invCurrency" className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ARS">ARS</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {isDuplicate && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2.5 mb-4">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                Ya existe un insumo con el mismo nombre, marca, volumen y tipo.
                {isEdit ? ' No se puede guardar porque generaría un duplicado.' : ' Cambiá el volumen si querés agregar otra presentación.'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isDuplicate || !hasChanges || !inventoryFieldsValid}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCreatingInventory ? 'Cargando stock...' : isEdit ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                isEdit ? 'Actualizar' : addToInventory ? 'Crear y cargar stock' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
