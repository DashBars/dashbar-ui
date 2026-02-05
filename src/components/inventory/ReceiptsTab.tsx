import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { Eye } from 'lucide-react';
import { InventoryLotDetailsSheet } from './InventoryLotDetailsSheet';
import type { InventoryMovement } from '@/lib/api/types';

interface ReceiptsTabProps {
  eventId: number;
  barId: number;
}

export function ReceiptsTab({ eventId, barId }: ReceiptsTabProps) {
  const { data: movements = [], isLoading } = useInventoryMovements(eventId, barId);
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Filter to only additions (quantity > 0)
  const receipts = useMemo(() => {
    let filtered = movements.filter((m) => m.quantity > 0);

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.drink?.name.toLowerCase().includes(lowerSearch) ||
          m.drink?.sku.toLowerCase().includes(lowerSearch) ||
          m.supplier?.name.toLowerCase().includes(lowerSearch),
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [movements, search]);

  const handleViewDetails = (movement: InventoryMovement) => {
    setSelectedMovement(movement);
    setDetailsSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search receipts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Ownership</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No receipts found
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {new Date(movement.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {movement.drink?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {movement.drink?.sku || '-'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{movement.supplier?.name || 'Unknown'}</TableCell>
                  <TableCell>{movement.quantity}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {movement.type === 'adjustment' ? 'Adjustment' : 'Receipt'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(movement)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InventoryLotDetailsSheet
        movement={selectedMovement}
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
      />
    </div>
  );
}
