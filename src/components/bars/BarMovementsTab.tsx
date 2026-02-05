import { useMemo } from 'react';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { InventoryMovement } from '@/lib/api/types';

interface BarMovementsTabProps {
  eventId: number;
  barId: number;
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

function formatQuantity(movement: InventoryMovement) {
  const sign = movement.quantity > 0 ? '+' : '';
  return `${sign}${movement.quantity}`;
}

export function BarMovementsTab({ eventId, barId }: BarMovementsTabProps) {
  const { data: movements = [], isLoading, error } = useInventoryMovements(eventId, barId);

  const grouped = useMemo(() => {
    return movements;
  }, [movements]);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Movimientos de stock</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">
              Error al cargar movimientos de stock.
            </p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay movimientos de stock registrados para esta barra.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(movement.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.drink?.name || `Drink ${movement.drinkId}`}
                      </TableCell>
                      <TableCell>
                        {movement.supplier?.name || `Supplier ${movement.supplierId}`}
                      </TableCell>
                      <TableCell>{formatQuantity(movement)}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}

