import { useMemo } from 'react';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead, useTableSort, sortItems } from '@/components/ui/sortable-table-head';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PackagePlus, PackageMinus, ArrowLeftRight, ShoppingCart, Wrench, CornerUpLeft, Package, Beaker } from 'lucide-react';
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
  return Math.abs(movement.quantity).toString();
}

function getMovementDescription(movement: InventoryMovement): { text: string; icon: React.ReactNode; iconColor: string } {
  const reason = movement.reason;
  
  switch (reason) {
    case 'ASSIGN_TO_BAR':
      return {
        text: 'Asignado desde almacén general',
        icon: <PackagePlus className="h-4 w-4" />,
        iconColor: 'text-green-600',
      };
    case 'RETURN_TO_GLOBAL':
      return {
        text: 'Devuelto a almacén general',
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
        text: movement.notes?.toLowerCase().includes('descarte')
          ? 'Descarte de remanente'
          : 'Ajuste manual',
        icon: <Wrench className="h-4 w-4" />,
        iconColor: movement.notes?.toLowerCase().includes('descarte')
          ? 'text-amber-600'
          : 'text-gray-600',
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

export function BarMovementsTab({ eventId, barId }: BarMovementsTabProps) {
  const { data: movements = [], isLoading, error } = useInventoryMovements(eventId, barId);
  const { sortKey, sortDir, handleSort } = useTableSort();

  const grouped = useMemo(() => {
    return movements;
  }, [movements]);

  const sortGetters = useMemo(
    () => ({
      date: (item: InventoryMovement) => new Date(item.createdAt).getTime(),
      drink: (item: InventoryMovement) => item.drink?.name?.toLowerCase() ?? '',
      supplier: (item: InventoryMovement) => item.supplier?.name?.toLowerCase() ?? '',
      purpose: (item: InventoryMovement) =>
        item.sellAsWholeUnit === true
          ? 'venta directa'
          : item.sellAsWholeUnit === false
            ? 'para recetas'
            : '',
      quantity: (item: InventoryMovement) => Math.abs(item.quantity),
      movement: (item: InventoryMovement) => getMovementDescription(item).text.toLowerCase(),
      notes: (item: InventoryMovement) => (item.notes?.toLowerCase() ?? ''),
    }),
    [],
  );

  const sortedItems = useMemo(
    () => sortItems(grouped, sortKey, sortDir, sortGetters),
    [grouped, sortKey, sortDir, sortGetters],
  );

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
                    <SortableTableHead sortKey="date" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                      Fecha
                    </SortableTableHead>
                    <SortableTableHead sortKey="drink" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                      Insumo
                    </SortableTableHead>
                    <SortableTableHead sortKey="supplier" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                      Proveedor
                    </SortableTableHead>
                    <SortableTableHead sortKey="purpose" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                      Destino
                    </SortableTableHead>
                    <SortableTableHead sortKey="quantity" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                      Cantidad
                    </SortableTableHead>
                    <SortableTableHead sortKey="movement" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                      Movimiento
                    </SortableTableHead>
                    <SortableTableHead sortKey="notes" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>
                      Notas
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((movement) => {
                    const description = getMovementDescription(movement);
                    const purposeBadge = getPurposeBadge(movement);
                    return (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDate(movement.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.drink?.name || 'Insumo desconocido'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {movement.supplier?.name || 'Proveedor desconocido'}
                        </TableCell>
                        <TableCell>
                          {purposeBadge || <span className="text-muted-foreground text-sm">—</span>}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatQuantity(movement)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={description.iconColor}>{description.icon}</span>
                            <span className="text-sm">{description.text}</span>
                          </div>
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
        </CardContent>
      </Card>
    </div>
  );
}

