import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  ShoppingCart,
  Wrench,
  CornerUpLeft,
  Package,
  Beaker,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { StockTable } from '@/components/inventory/StockTable';
import { MoveStockDialog } from '@/components/inventory/MoveStockDialog';
import { ReturnStockDialog } from '@/components/inventory/ReturnStockDialog';
import type { Stock, InventoryMovement } from '@/lib/api/types';
import { AssignBarStockDialog } from '@/components/bars/AssignBarStockDialog';

interface StockTabProps {
  eventId: number;
  barId: number;
}

/* ── Movement helpers ── */

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

function getMovementDescription(movement: InventoryMovement): {
  text: string;
  icon: React.ReactNode;
  iconColor: string;
} {
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
        text: movement.sellAsWholeUnit ? 'Venta directa' : 'Venta (receta)',
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
      if (movement.type === 'sale') {
        return {
          text: movement.sellAsWholeUnit ? 'Venta directa' : 'Venta (receta)',
          icon: <ShoppingCart className="h-4 w-4" />,
          iconColor: 'text-purple-600',
        };
      }
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

/**
 * Format the movement quantity in a meaningful way.
 * - Assign/return/move movements store quantity in units → show "X un."
 * - Sale movements store quantity in ml → convert to units if possible, else show ml
 */
function formatMovementQuantity(movement: InventoryMovement): string {
  const qty = Math.abs(movement.quantity);
  const drinkVolume = movement.drink?.volume;

  // Sale movements are stored in ml — convert to units for display
  if (movement.type === 'sale' && drinkVolume && drinkVolume > 0) {
    const units = qty / drinkVolume;
    if (units >= 1 && Number.isInteger(units)) {
      return `${units} un.`;
    }
    // Fractional units — show ml with context
    if (qty >= 1000) {
      return `${(qty / 1000).toFixed(1)} L`;
    }
    return `${qty} ml`;
  }

  // Non-sale movements are stored in units
  return `${qty} un.`;
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

/* ── Component ── */

export function StockTab({ eventId, barId }: StockTabProps) {
  const { data: stock = [], isLoading } = useStock(eventId, barId);
  const { data: movements = [], isLoading: isLoadingMovements, error: movementsError } = useInventoryMovements(eventId, barId);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [stockToMove, setStockToMove] = useState<Stock | null>(null);
  const [stockToReturn, setStockToReturn] = useState<Stock | null>(null);
  const [showStock, setShowStock] = useState(true);
  const [showMovements, setShowMovements] = useState(false);

  const handleMove = (item: Stock) => {
    setStockToMove(item);
    setMoveDialogOpen(true);
  };

  const handleReturn = (item: Stock) => {
    setStockToReturn(item);
    setReturnDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stock section */}
      <Card className="rounded-2xl">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setShowStock((prev) => !prev)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Stock de la Barra</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Solo podés asignar stock desde el inventario global y devolverlo cuando corresponda
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Asignar desde Inventario Global</span>
                <span className="sm:hidden">Asignar</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground shrink-0">
                {showStock ? (
                  <>
                    Ocultar
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Ver stock
                    {stock.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {stock.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {showStock && (
          <CardContent>
            <div className="max-h-[45vh] overflow-y-auto rounded-lg">
              <StockTable
                items={stock}
                isLoading={isLoading}
                mode="bar"
                onMove={handleMove}
                onReturn={handleReturn}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Movements section */}
      <Card className="rounded-2xl">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setShowMovements((prev) => !prev)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Movimientos de stock</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              {showMovements ? (
                <>
                  Ocultar
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Ver historial
                  {movements.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {movements.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {showMovements && (
          <CardContent>
            {isLoadingMovements ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : movementsError ? (
              <p className="text-sm text-destructive">
                Error al cargar movimientos de stock.
              </p>
            ) : movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay movimientos de stock registrados para esta barra.
              </p>
            ) : (
              <div className="max-h-[40vh] overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Movimiento</TableHead>
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
                              {formatMovementQuantity(movement)}
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
        )}
      </Card>

      {/* Dialogs */}
      <AssignBarStockDialog
        eventId={eventId}
        barId={barId}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
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
