import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useStock, useDeleteStock } from '@/hooks/useStock';
import { StockAdjustDialog } from './StockAdjustDialog';
import { StockTable } from '@/components/inventory/StockTable';
import { MoveStockDialog } from '@/components/inventory/MoveStockDialog';
import { ReturnStockDialog } from '@/components/inventory/ReturnStockDialog';
import type { Stock } from '@/lib/api/types';

interface StockTabProps {
  eventId: number;
  barId: number;
}

export function StockTab({ eventId, barId }: StockTabProps) {
  const { data: stock = [], isLoading } = useStock(eventId, barId);
  const deleteStock = useDeleteStock(eventId, barId);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [stockToMove, setStockToMove] = useState<Stock | null>(null);
  const [stockToReturn, setStockToReturn] = useState<Stock | null>(null);

  const handleDelete = (item: Stock) => {
    if (
      confirm(
        `¿Estás seguro de que quieres eliminar el stock de ${item.drink?.name} del proveedor ${item.supplier?.name}?`
      )
    ) {
      deleteStock.mutate({
        drinkId: item.drinkId,
        supplierId: item.supplierId,
      });
    }
  };

  const handleMove = (item: Stock) => {
    setStockToMove(item);
    setMoveDialogOpen(true);
  };

  const handleReturn = (item: Stock) => {
    setStockToReturn(item);
    setReturnDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stock de la Barra</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona el stock asignado a esta barra
          </p>
        </div>
        <Button onClick={() => setAdjustDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajustar Stock
        </Button>
      </div>

      <StockTable
        items={stock}
        isLoading={isLoading}
        mode="bar"
        onMove={handleMove}
        onReturn={handleReturn}
        onDelete={handleDelete}
      />

      <StockAdjustDialog
        eventId={eventId}
        barId={barId}
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
      />

      {stockToMove && (
        <MoveStockDialog
          stock={stockToMove}
          eventId={eventId}
          open={moveDialogOpen}
          onOpenChange={(open) => {
            setMoveDialogOpen(open);
            if (!open) setStockToMove(null);
          }}
        />
      )}

      {stockToReturn && (
        <ReturnStockDialog
          stock={stockToReturn}
          eventId={eventId}
          open={returnDialogOpen}
          onOpenChange={(open) => {
            setReturnDialogOpen(open);
            if (!open) setStockToReturn(null);
          }}
        />
      )}
    </div>
  );
}
