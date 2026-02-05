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
import { useUpsertStock } from '@/hooks/useStock';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useDrinks, useSearchDrinks } from '@/hooks/useDrinks';
import type { OwnershipMode } from '@/lib/api/types';
import { Loader2, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface InventoryReceiptDialogProps {
  eventId: number;
  barId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryReceiptDialog({
  eventId,
  barId,
  open,
  onOpenChange,
}: InventoryReceiptDialogProps) {
  const { mutate: upsertStock, isPending } = useUpsertStock(eventId, barId);
  const { data: suppliers = [] } = useSuppliers();
  const { data: drinks = [] } = useDrinks();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: searchResults = [] } = useSearchDrinks(debouncedSearch);

  const [drinkId, setDrinkId] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('purchased');
  const [unitCost, setUnitCost] = useState<number | ''>(0);
  const [currency, setCurrency] = useState('ARS');

  const displayDrinks = debouncedSearch ? searchResults : drinks;

  useEffect(() => {
    if (open) {
      setDrinkId('');
      setSupplierId('');
      setQuantity(1);
      setOwnershipMode('purchased');
      setUnitCost(0);
      setCurrency('ARS');
      setSearchQuery('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!drinkId || !supplierId || !quantity || quantity <= 0) {
      return;
    }

    upsertStock(
      {
        drinkId: Number(drinkId),
        supplierId: Number(supplierId),
        quantity: Number(quantity),
        unitCost: Number(unitCost) * 100, // Convert to cents
        currency,
        ownershipMode,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  const totalValue =
    quantity && unitCost
      ? ((Number(quantity) * Number(unitCost)) / 100).toFixed(2)
      : '0.00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>
            Register a new stock receipt for this bar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="drink-search">
                Item <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="drink-search"
                  placeholder="Search by name, brand, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {displayDrinks.length > 0 && (
                <Select
                  value={drinkId ? String(drinkId) : ''}
                  onValueChange={(value) => setDrinkId(Number(value))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {displayDrinks.map((drink) => (
                      <SelectItem key={drink.id} value={String(drink.id)}>
                        {drink.name} ({drink.brand}) - {drink.sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">
                Supplier <span className="text-destructive">*</span>
              </Label>
              <Select
                value={supplierId ? String(supplierId) : ''}
                onValueChange={(value) => setSupplierId(Number(value))}
                required
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value ? Number(e.target.value) : '')
                  }
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownership">Ownership</Label>
                <Select
                  value={ownershipMode}
                  onValueChange={(value) =>
                    setOwnershipMode(value as OwnershipMode)
                  }
                >
                  <SelectTrigger id="ownership">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchased">Purchased</SelectItem>
                    <SelectItem value="consignment">Consignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-cost">
                  Unit Cost <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unit-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) =>
                    setUnitCost(e.target.value ? Number(e.target.value) : '')
                  }
                  required
                  disabled={isPending}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
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

            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Value:</span>
                <span className="text-lg font-bold">
                  {currency} {totalValue}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Stock'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
