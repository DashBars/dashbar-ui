import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { InventoryMovement } from '@/lib/api/types';

interface InventoryLotDetailsSheetProps {
  movement: InventoryMovement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryLotDetailsSheet({
  movement,
  open,
  onOpenChange,
}: InventoryLotDetailsSheetProps) {
  if (!movement) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Receipt Details</SheetTitle>
          <SheetDescription>
            View detailed information about this inventory movement.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Item Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{movement.drink?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brand:</span>
                <span>{movement.drink?.brand || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU:</span>
                <span>{movement.drink?.sku || '-'}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Supplier Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-medium">
                  {movement.supplier?.name || 'Unknown'}
                </span>
              </div>
              {movement.supplier?.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{movement.supplier.email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Movement Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{movement.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline">{movement.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(movement.createdAt).toLocaleString()}</span>
              </div>
              {movement.notes && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Notes:</span>
                  <span className="text-sm">{movement.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
