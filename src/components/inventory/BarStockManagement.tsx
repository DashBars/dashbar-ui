import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useEvents } from '@/hooks/useEvents';
import { useBars } from '@/hooks/useBars';
import { useStock, useDeleteStock } from '@/hooks/useStock';
import { StockAdjustDialog } from '@/components/bars/StockAdjustDialog';
import { InventoryReceiptDialog } from '@/components/inventory/InventoryReceiptDialog';
import { useManagerInventory } from '@/hooks/useManagerInventory';
import { TransferToBarDialog } from './TransferToBarDialog';
import type { Stock } from '@/lib/api/types';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export function BarStockManagement() {
  const { data: events = [] } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedBarId, setSelectedBarId] = useState<string>('');

  const eventIdNum = selectedEventId ? parseInt(selectedEventId, 10) : 0;
  const barIdNum = selectedBarId ? parseInt(selectedBarId, 10) : 0;

  const { data: bars = [], isLoading: isLoadingBars } = useBars(eventIdNum);
  const { data: stock = [], isLoading: isLoadingStock } = useStock(
    eventIdNum,
    barIdNum,
  );
  const { data: inventory = [] } = useManagerInventory();
  const deleteStock = useDeleteStock(eventIdNum, barIdNum);

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [inventoryToTransfer, setInventoryToTransfer] = useState<number | null>(
    null,
  );
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');

  // Reset bar selection when event changes
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedBarId('');
  };

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
        `¿Estás seguro de que quieres eliminar el stock de ${item.drink?.name} del proveedor ${item.supplier?.name}?`,
      )
    ) {
      deleteStock.mutate({
        drinkId: item.drinkId,
        supplierId: item.supplierId,
      });
    }
  };

  const handleTransferFromInventory = (inventoryId: number) => {
    setInventoryToTransfer(inventoryId);
    setTransferDialogOpen(true);
  };

  const selectedInventory = inventory.find((i) => i.id === inventoryToTransfer);

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Barra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Evento</label>
              <Select
                value={selectedEventId}
                onValueChange={handleEventChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Barra</label>
              <Select
                value={selectedBarId}
                onValueChange={setSelectedBarId}
                disabled={!selectedEventId || isLoadingBars}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingBars
                        ? 'Cargando barras...'
                        : !selectedEventId
                          ? 'Primero selecciona un evento'
                          : 'Seleccionar barra'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {bars.map((bar) => (
                    <SelectItem key={bar.id} value={bar.id.toString()}>
                      {bar.name} ({bar.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Management */}
      {selectedEventId && selectedBarId && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Stock de la Barra</h2>
            <div className="flex gap-2">
              {inventory.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setTransferDialogOpen(true)}
                  disabled={inventory.length === 0}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Transferir desde Inventario
                </Button>
              )}
              <Button onClick={() => setReceiptDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Stock Directo
              </Button>
              <Button
                variant="outline"
                onClick={() => setAdjustDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajustar Stock
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Proveedores</SelectItem>
                {Array.from(
                  new Set(stock?.map((s) => s.supplierId.toString()) || []),
                ).map((supplierId) => {
                  const supplier = stock?.find(
                    (s) => s.supplierId.toString() === supplierId,
                  )?.supplier;
                  return (
                    <SelectItem key={supplierId} value={supplierId}>
                      {supplier?.name || `Proveedor ${supplierId}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select
              value={ownershipFilter}
              onValueChange={setOwnershipFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por propiedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Propiedades</SelectItem>
                <SelectItem value="purchased">Comprado</SelectItem>
                <SelectItem value="consignment">Consignación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Actual</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStock ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : !filteredStock || filteredStock.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay stock en esta barra. Agrega stock usando los botones
                  arriba.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bebida</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Costo Unitario</TableHead>
                      <TableHead>Propiedad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock.map((item) => (
                      <TableRow key={`${item.drinkId}-${item.supplierId}`}>
                        <TableCell className="font-medium">
                          {item.drink?.name || `Bebida ${item.drinkId}`}
                        </TableCell>
                        <TableCell>{item.drink?.brand || '—'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.supplier?.name || `Proveedor ${item.supplierId}`}
                        </TableCell>
                        <TableCell>
                          {item.currency} {(item.unitCost / 100).toFixed(2)}
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
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Transfer from Inventory Section */}
          {inventory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transferir desde Inventario Global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventory
                    .filter((inv) => inv.totalQuantity - inv.allocatedQuantity > 0)
                    .map((inv) => {
                      const available = inv.totalQuantity - inv.allocatedQuantity;
                      return (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {inv.drink.name} - {inv.drink.brand}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Disponible: {available} / {inv.totalQuantity} | SKU: {inv.sku || inv.drink.sku}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTransferFromInventory(inv.id)}
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Transferir
                          </Button>
                        </div>
                      );
                    })}
                  {inventory.filter(
                    (inv) => inv.totalQuantity - inv.allocatedQuantity > 0,
                  ).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay insumos disponibles en el inventario global
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialogs */}
      {selectedEventId && selectedBarId && (
        <>
          <StockAdjustDialog
            eventId={eventIdNum}
            barId={barIdNum}
            open={adjustDialogOpen}
            onOpenChange={setAdjustDialogOpen}
          />

          <InventoryReceiptDialog
            eventId={eventIdNum}
            barId={barIdNum}
            open={receiptDialogOpen}
            onOpenChange={setReceiptDialogOpen}
          />
        </>
      )}

      {selectedInventory && (
        <TransferToBarDialog
          inventory={selectedInventory}
          open={transferDialogOpen}
          onOpenChange={(open) => {
            setTransferDialogOpen(open);
            if (!open) {
              setInventoryToTransfer(null);
            }
          }}
          preselectedEventId={eventIdNum}
          preselectedBarId={barIdNum}
        />
      )}
    </div>
  );
}
