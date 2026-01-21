import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useConsignmentSummary, useExecuteReturn, useExecuteAllReturns } from '@/hooks/useConsignment';
import { stockApi } from '@/lib/api/dashbar';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Package } from 'lucide-react';
import { ConsignmentReturnSummary } from './ConsignmentReturnSummary';
import type { ConsignmentReturnSummary as ConsignmentReturnSummaryType } from '@/lib/api/types';

interface ConsignmentReturnsTabProps {
  eventId: number;
  barId: number;
}

export function ConsignmentReturnsTab({
  eventId,
  barId,
}: ConsignmentReturnsTabProps) {
  const { data: summary = [], isLoading: summaryLoading } = useConsignmentSummary(
    eventId,
    barId,
  );
  const { data: returnsHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['stock', 'consignment-returns', eventId, barId],
    queryFn: () => stockApi.getConsignmentReturns(eventId, barId),
    enabled: !!eventId && !!barId,
  });

  const { mutate: executeReturn, isPending: isExecuting } = useExecuteReturn(
    eventId,
    barId,
  );
  const { mutate: executeAllReturns, isPending: isExecutingAll } =
    useExecuteAllReturns(eventId, barId);

  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<ConsignmentReturnSummaryType | null>(null);
  const [notes, setNotes] = useState('');
  const [executeAllDialogOpen, setExecuteAllDialogOpen] = useState(false);

  // Group summary by supplier
  const groupedBySupplier = useMemo(() => {
    const grouped = new Map<
      number,
      { supplierName: string; items: ConsignmentReturnSummaryType[] }
    >();

    summary.forEach((item) => {
      if (!grouped.has(item.supplierId)) {
        grouped.set(item.supplierId, {
          supplierName: item.supplierName,
          items: [],
        });
      }
      grouped.get(item.supplierId)!.items.push(item);
    });

    return Array.from(grouped.entries()).map(([supplierId, data]) => ({
      supplierId,
      ...data,
    }));
  }, [summary]);

  const handleExecuteReturn = (item: ConsignmentReturnSummaryType) => {
    setSelectedItem(item);
    setNotes('');
    setExecuteDialogOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!selectedItem) return;

    executeReturn(
      {
        drinkId: selectedItem.drinkId,
        supplierId: selectedItem.supplierId,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setExecuteDialogOpen(false);
          setSelectedItem(null);
          setNotes('');
        },
      },
    );
  };

  const handleExecuteAll = () => {
    executeAllReturns(undefined, {
      onSuccess: () => {
        setExecuteAllDialogOpen(false);
      },
    });
  };

  const totalToReturn = summary.reduce((sum, item) => sum + item.quantityToReturn, 0);

  if (summaryLoading || historyLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {summary.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Consignment Return Summary</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  System-calculated quantities to return. These values cannot be
                  modified.
                </p>
              </div>
              {totalToReturn > 0 && (
                <Button
                  onClick={() => setExecuteAllDialogOpen(true)}
                  disabled={isExecutingAll}
                >
                  {isExecutingAll ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Execute All Returns
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ConsignmentReturnSummary
              groupedBySupplier={groupedBySupplier}
              onExecuteReturn={handleExecuteReturn}
              isExecuting={isExecuting}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No consignment stock to return
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              All consignment stock has been returned or there is no consignment
              stock in this bar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Return History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity Returned</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnsHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No returns recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  returnsHistory.map((returnItem: any) => (
                    <TableRow key={returnItem.id}>
                      <TableCell>
                        {new Date(returnItem.returnedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {returnItem.supplier?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {returnItem.stock?.drink?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{returnItem.quantityReturned}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Execute Return Dialog */}
      <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute Consignment Return</DialogTitle>
            <DialogDescription>
              Return {selectedItem?.quantityToReturn} units of{' '}
              {selectedItem?.drinkName} to {selectedItem?.supplierName}. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item:</span>
                <span className="font-medium">{selectedItem?.drinkName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-medium">{selectedItem?.supplierName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity to return:</span>
                <span className="font-medium">{selectedItem?.quantityToReturn}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this return..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExecuteDialogOpen(false)}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmReturn} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                'Execute Return'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execute All Dialog */}
      <Dialog open={executeAllDialogOpen} onOpenChange={setExecuteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute All Consignment Returns</DialogTitle>
            <DialogDescription>
              This will register returns for all remaining consignment stock in
              this bar. The quantities are system-calculated and cannot be
              modified. Continue?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total items to return:</span>
              <span className="font-medium">{summary.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total quantity:</span>
              <span className="font-medium">{totalToReturn}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExecuteAllDialogOpen(false)}
              disabled={isExecutingAll}
            >
              Cancel
            </Button>
            <Button onClick={handleExecuteAll} disabled={isExecutingAll}>
              {isExecutingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                'Execute All Returns'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
