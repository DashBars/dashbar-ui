import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventoryAllocations } from '@/hooks/useManagerInventory';
import type { ManagerInventory } from '@/lib/api/types';

interface InventoryAllocationsViewProps {
  inventory: ManagerInventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Fecha inválida';
  }
}

export function InventoryAllocationsView({
  inventory,
  open,
  onOpenChange,
}: InventoryAllocationsViewProps) {
  const { data: allocations = [], isLoading } = useInventoryAllocations(
    inventory.id,
  );

  const totalAllocated = allocations.reduce(
    (sum, alloc) => sum + alloc.quantity,
    0,
  );
  const available = inventory.totalQuantity - totalAllocated;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Distribución de {inventory.drink.name}</DialogTitle>
          <DialogDescription>
            Ver todas las asignaciones de este insumo a las barras
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{inventory.totalQuantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Asignada</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalAllocated}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponible</p>
              <p className="text-2xl font-bold text-green-600">{available}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : allocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay asignaciones aún
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Barra</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell className="font-medium">
                        {allocation.event.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{allocation.bar.name}</Badge>
                      </TableCell>
                      <TableCell>{allocation.quantity}</TableCell>
                      <TableCell>{formatDate(allocation.allocatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
