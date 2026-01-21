import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useStock, useDeleteStock } from '@/hooks/useStock';
import { StockAdjustDialog } from './StockAdjustDialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Stock } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';

interface StockTabProps {
  eventId: number;
  barId: number;
}

export function StockTab({ eventId, barId }: StockTabProps) {
  const { data: stock, isLoading } = useStock(eventId, barId);
  const deleteStock = useDeleteStock(eventId, barId);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');

  const filteredStock = stock?.filter((item) => {
    const matchesSupplier =
      supplierFilter === 'all' ||
      item.supplierId.toString() === supplierFilter;
    const matchesOwnership =
      ownershipFilter === 'all' || item.ownershipMode === ownershipFilter;
    return matchesSupplier && matchesOwnership;
  });

  const handleDelete = (item: Stock) => {
    if (
      confirm(
        `Are you sure you want to delete stock for ${item.drink?.name} from supplier ${item.supplier?.name}?`
      )
    ) {
      deleteStock.mutate({
        drinkId: item.drinkId,
        supplierId: item.supplierId,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {Array.from(
                new Set(stock?.map((s) => s.supplierId.toString()) || [])
              ).map((supplierId) => {
                const supplier = stock?.find(
                  (s) => s.supplierId.toString() === supplierId
                )?.supplier;
                return (
                  <SelectItem key={supplierId} value={supplierId}>
                    {supplier?.name || `Supplier ${supplierId}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by ownership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ownership</SelectItem>
              <SelectItem value="purchased">Purchased</SelectItem>
              <SelectItem value="consignment">Consignment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAdjustDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adjust Stock
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock</CardTitle>
        </CardHeader>
        <CardContent>
          {!filteredStock || filteredStock.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No stock entries found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drink</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((item) => (
                  <TableRow key={`${item.drinkId}-${item.supplierId}`}>
                    <TableCell className="font-medium">
                      {item.drink?.name || `Drink ${item.drinkId}`}
                    </TableCell>
                    <TableCell>{item.drink?.brand || '—'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.supplier?.name || `Supplier ${item.supplierId}`}
                    </TableCell>
                    <TableCell>
                      {item.currency} {item.unitCost / 100}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.ownershipMode}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <StockAdjustDialog
        eventId={eventId}
        barId={barId}
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
      />
    </div>
  );
}
