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
          <SheetTitle>Detalles del Comprobante</SheetTitle>
          <SheetDescription>
            Información detallada de este movimiento de inventario.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Información del Insumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{movement.drink?.name || 'Desconocido'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marca:</span>
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
            <h3 className="text-sm font-medium mb-2">Información del Proveedor</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proveedor:</span>
                <span className="font-medium">
                  {movement.supplier?.name || 'Desconocido'}
                </span>
              </div>
              {movement.supplier?.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correo:</span>
                  <span>{movement.supplier.email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Detalles del Movimiento</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cantidad:</span>
                <span className="font-medium">{movement.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="outline">
                  {movement.type === 'adjustment'
                    ? (movement.notes?.toLowerCase().includes('descarte') ? 'Descarte' : 'Ajuste')
                    : 'Comprobante'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span>{new Date(movement.createdAt).toLocaleString()}</span>
              </div>
              {movement.notes && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Notas:</span>
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
