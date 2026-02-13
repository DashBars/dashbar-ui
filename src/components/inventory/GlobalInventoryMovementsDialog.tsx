import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useGlobalInventoryMovements } from '@/hooks/useInventoryMovements';
import type { GlobalInventory, InventoryMovement } from '@/lib/api/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  ShoppingCart,
  Wrench,
  CornerUpLeft,
  Package,
  Beaker,
} from 'lucide-react';

interface GlobalInventoryMovementsDialogProps {
  inventory: GlobalInventory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMovementDescription(movement: InventoryMovement): { text: string; icon: React.ReactNode; iconColor: string } {
  const reason = movement.reason;

  switch (reason) {
    case 'ASSIGN_TO_BAR':
      return {
        text: 'Asignado a barra',
        icon: <PackagePlus className="h-4 w-4" />,
        iconColor: 'text-green-600',
      };
    case 'RETURN_TO_GLOBAL':
      return {
        text: 'Devuelto desde barra',
        icon: <PackageMinus className="h-4 w-4" />,
        iconColor: 'text-orange-600',
      };
    case 'MOVE_BETWEEN_BARS':
      return {
        text: movement.quantity > 0 ? 'Recibido desde otra barra' : 'Enviado a otra barra',
        icon: <ArrowLeftRight className="h-4 w-4" />,
        iconColor: 'text-blue-600',
      };
    case 'SALE_DECREMENT':
      return {
        text: 'Venta',
        icon: <ShoppingCart className="h-4 w-4" />,
        iconColor: 'text-purple-600',
      };
    case 'ADJUSTMENT':
      return {
        text: 'Ajuste manual',
        icon: <Wrench className="h-4 w-4" />,
        iconColor: 'text-gray-600',
      };
    case 'RETURN_TO_PROVIDER':
      return {
        text: 'Devuelto a proveedor',
        icon: <CornerUpLeft className="h-4 w-4" />,
        iconColor: 'text-red-600',
      };
    case 'INITIAL_LOAD':
      return {
        text: 'Carga inicial',
        icon: <Package className="h-4 w-4" />,
        iconColor: 'text-teal-600',
      };
    default:
      if (movement.type === 'transfer_in' || movement.quantity > 0) {
        return {
          text: 'Entrada de stock',
          icon: <PackagePlus className="h-4 w-4" />,
          iconColor: 'text-green-600',
        };
      }
      return {
        text: 'Salida de stock',
        icon: <PackageMinus className="h-4 w-4" />,
        iconColor: 'text-orange-600',
      };
  }
}

function getPurposeBadge(movement: InventoryMovement) {
  if (movement.sellAsWholeUnit === true) {
    return (
      <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50">
        <Package className="h-3 w-3" />
        Venta directa
      </Badge>
    );
  }
  if (movement.sellAsWholeUnit === false) {
    return (
      <Badge variant="outline" className="gap-1 text-blue-700 border-blue-300 bg-blue-50">
        <Beaker className="h-3 w-3" />
        Para recetas
      </Badge>
    );
  }
  return null;
}

export function GlobalInventoryMovementsDialog({
  inventory,
  open,
  onOpenChange,
}: GlobalInventoryMovementsDialogProps) {
  const inventoryId = inventory?.id ?? 0;
  const { data: movements = [], isLoading, error } = useGlobalInventoryMovements(inventoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Movimientos de stock del insumo</DialogTitle>
          <DialogDescription>
            Historial de movimientos asociados a este registro de inventario global.
          </DialogDescription>
        </DialogHeader>
        {!inventory ? (
          <p className="text-sm text-muted-foreground">No se seleccionó ningún insumo.</p>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {inventory.drink?.name} {inventory.drink?.brand && `- ${inventory.drink.brand}`}
                  </div>
                  <div className="text-muted-foreground">
                    Proveedor: {inventory.supplier?.name || 'Sin proveedor'}
                  </div>
                </div>
                {inventory.drink && (
                  <Badge variant="secondary" className="text-xs">
                    {inventory.drink.volume}ml
                  </Badge>
                )}
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">
                Error al cargar movimientos de inventario.
              </p>
            ) : movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay movimientos registrados para este insumo en el inventario global.
              </p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Movimiento</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
                      const description = getMovementDescription(movement);
                      const purposeBadge = getPurposeBadge(movement);
                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDate(movement.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {movement.bar?.name || (movement.barId ? 'Barra desconocida' : 'Inventario Global')}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {Math.abs(movement.quantity)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={description.iconColor}>{description.icon}</span>
                              <span className="text-sm">{description.text}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {purposeBadge || <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-sm text-muted-foreground">
                              {movement.notes || '—'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
