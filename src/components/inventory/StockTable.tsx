import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, ArrowRight, ArrowLeft, ArrowUpDown } from 'lucide-react';
import type { GlobalInventory, Stock, OwnershipMode } from '@/lib/api/types';

type StockTableItem = GlobalInventory | Stock;

interface StockTableProps {
  items: StockTableItem[];
  isLoading?: boolean;
  mode: 'global' | 'bar'; // Determina qué acciones mostrar
  onAssign?: (item: GlobalInventory) => void; // Solo para global
  onMove?: (item: Stock) => void; // Solo para bar
  onReturn?: (item: Stock) => void; // Solo para bar
  onEdit?: (item: StockTableItem) => void;
  onDelete?: (item: StockTableItem) => void;
  suppliers?: Array<{ id: number; name: string }>; // Para filtros
}

function isGlobalInventory(item: StockTableItem): item is GlobalInventory {
  return 'totalQuantity' in item && 'allocatedQuantity' in item;
}

function isStock(item: StockTableItem): item is Stock {
  return 'quantity' in item && 'barId' in item;
}

export function StockTable({
  items,
  isLoading,
  mode,
  onAssign,
  onMove,
  onReturn,
  onEdit,
  onDelete,
  suppliers = [],
}: StockTableProps) {
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((item) => {
        const drink = isGlobalInventory(item) ? item.drink : item.drink;
        const supplier = isGlobalInventory(item) ? item.supplier : item.supplier;
        return (
          drink?.name.toLowerCase().includes(lowerSearch) ||
          drink?.brand.toLowerCase().includes(lowerSearch) ||
          supplier?.name.toLowerCase().includes(lowerSearch) ||
          (isGlobalInventory(item) && item.sku?.toLowerCase().includes(lowerSearch))
        );
      });
    }

    // Supplier filter
    if (supplierFilter !== 'all') {
      const supplierId = parseInt(supplierFilter, 10);
      filtered = filtered.filter((item) => {
        const supplier = isGlobalInventory(item) ? item.supplier : item.supplier;
        return supplier?.id === supplierId || (isGlobalInventory(item) && item.supplierId === supplierId);
      });
    }

    // Ownership filter
    if (ownershipFilter !== 'all') {
      filtered = filtered.filter(
        (item) => item.ownershipMode === ownershipFilter,
      );
    }

    return filtered;
  }, [items, search, supplierFilter, ownershipFilter]);

  const formatCurrency = (amount: number, currency: string = 'ARS') => {
    return `${currency} ${(amount / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drink</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                {mode === 'global' && <TableHead>Available</TableHead>}
                {mode === 'global' && <TableHead>Allocated</TableHead>}
                <TableHead>Unit Cost</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Get unique suppliers from items
  const uniqueSuppliers = useMemo(() => {
    const supplierMap = new Map<number, { id: number; name: string }>();
    items.forEach((item) => {
      const supplier = isGlobalInventory(item) ? item.supplier : item.supplier;
      if (supplier && !supplierMap.has(supplier.id)) {
        supplierMap.set(supplier.id, supplier);
      }
    });
    return Array.from(supplierMap.values());
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre, marca, proveedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los proveedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {uniqueSuppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="purchased">Comprado</SelectItem>
            <SelectItem value="consignment">Consignación</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Drink</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Quantity</TableHead>
              {mode === 'global' && <TableHead>Available</TableHead>}
              {mode === 'global' && <TableHead>Allocated</TableHead>}
              <TableHead>Unit Cost</TableHead>
              <TableHead>Ownership</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={mode === 'global' ? 8 : 6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron items
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const drink = isGlobalInventory(item) ? item.drink : item.drink;
                const supplier = isGlobalInventory(item)
                  ? item.supplier
                  : item.supplier;
                const quantity = isGlobalInventory(item)
                  ? item.totalQuantity
                  : item.quantity;
                const availableQuantity = isGlobalInventory(item)
                  ? item.totalQuantity - item.allocatedQuantity
                  : undefined;

                const itemKey = isGlobalInventory(item)
                  ? item.id
                  : isStock(item)
                    ? `${item.barId}-${item.drinkId}-${item.supplierId}`
                    : `${item.drinkId}-${item.supplierId}`;

                return (
                  <TableRow key={itemKey}>
                    <TableCell className="font-medium">
                      {drink?.name || `Drink ${item.drinkId}`}
                    </TableCell>
                    <TableCell>
                      {supplier?.name || (item.supplierId ? `Supplier ${item.supplierId}` : 'Sin proveedor')}
                    </TableCell>
                    <TableCell>{quantity}</TableCell>
                    {mode === 'global' && (
                      <>
                        <TableCell>
                          <Badge
                            variant={
                              availableQuantity! > 0 ? 'default' : 'secondary'
                            }
                          >
                            {availableQuantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {isGlobalInventory(item)
                              ? item.allocatedQuantity
                              : 0}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      {formatCurrency(
                        item.unitCost,
                        item.currency || 'ARS',
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.ownershipMode === 'consignment'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {item.ownershipMode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {mode === 'global' && isGlobalInventory(item) && onAssign && (
                            <DropdownMenuItem onClick={() => onAssign(item)}>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Asignar a barra
                            </DropdownMenuItem>
                          )}
                          {mode === 'bar' && isStock(item) && onMove && (
                            <DropdownMenuItem onClick={() => onMove(item)}>
                              <ArrowUpDown className="mr-2 h-4 w-4" />
                              Mover a otra barra
                            </DropdownMenuItem>
                          )}
                          {mode === 'bar' && isStock(item) && onReturn && (
                            <DropdownMenuItem onClick={() => onReturn(item)}>
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              Devolver a global
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              Editar
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="text-destructive"
                            >
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
