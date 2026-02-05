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
import { useCreateDrink, useUpdateDrink } from '@/hooks/useDrinks';
import type { Drink, CreateDrinkDto, UpdateDrinkDto } from '@/lib/api/types';
import { Loader2 } from 'lucide-react';

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

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [drinkType, setDrinkType] = useState<'alcoholic' | 'non_alcoholic'>('non_alcoholic');
  const [volume, setVolume] = useState<string>('');

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
      }
    }
  }, [open, drink, isEdit]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEdit) {
      const dto: UpdateDrinkDto = {
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
        // providerType se establece automáticamente como 'in_' en el backend
        volume: parseInt(volume, 10),
      };
      createDrink(dto, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isSubmitting = isCreating || isUpdating;

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
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Coca Cola"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">
                Marca <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                disabled={isSubmitting}
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
                Código único del producto
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="drinkType">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={drinkType}
                onValueChange={(value: 'alcoholic' | 'non_alcoholic') =>
                  setDrinkType(value)
                }
                disabled={isSubmitting}
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
              <Label htmlFor="volume">
                Volumen (ml) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="volume"
                type="number"
                min="1"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="1250"
              />
              <p className="text-xs text-muted-foreground">
                Ejemplo: 1250 = 1.25 litros
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
