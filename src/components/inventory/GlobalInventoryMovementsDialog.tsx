import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useGlobalInventoryMovements } from '@/hooks/useInventoryMovements';
import type { GlobalInventory } from '@/lib/api/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

export function GlobalInventoryMovementsDialog({
  inventory,
  open,
  onOpenChange,
}: GlobalInventoryMovementsDialogProps) {
  const inventoryId = inventory?.id ?? 0;
  const { data: movements = [], isLoading, error } = useGlobalInventoryMovements(inventoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Movimientos de stock del insumo</DialogTitle>
          <DialogDescription>
            Notas y movimientos asociados a este registro de inventario global.
          </DialogDescription>
        </DialogHeader>
        {!inventory ? (
          <p className="text-sm text-muted-foreground">No se seleccionó ningún insumo.</p>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 text-sm">
                <div className="font-medium">
                  {inventory.drink?.name} {inventory.drink?.brand && `- ${inventory.drink.brand}`}
                </div>
                <div className="text-muted-foreground">
                  Proveedor: {inventory.supplier?.name || 'Sin proveedor'}
                </div>
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
                      <TableHead>Barra</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(movement.createdAt)}
                        </TableCell>
                        <TableCell>
                          {movement.barId ? `Bar ${movement.barId}` : 'Inventario Global'}
                        </TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{movement.type}</TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm text-muted-foreground">
                            {movement.notes || '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
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

