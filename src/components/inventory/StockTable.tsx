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
import type { GlobalInventory, Stock } from '@/lib/api/types';

type GlobalStockTableProps = {
  mode: 'global';
  items: GlobalInventory[];
  isLoading?: boolean;
  onAssign?: (item: GlobalInventory) => void;
  onEdit?: (item: GlobalInventory) => void;
  onDelete?: (item: GlobalInventory) => void;
  onViewMovements?: (item: GlobalInventory) => void;
};

type BarStockTableProps = {
  mode: 'bar';
  items: Stock[];
  isLoading?: boolean;
  onMove?: (item: Stock) => void;
  onReturn?: (item: Stock) => void;
  onDelete?: (item: Stock) => void;
};

type StockTableProps = GlobalStockTableProps | BarStockTableProps;

function isGlobalInventory(item: GlobalInventory | Stock): item is GlobalInventory {
  return (item as GlobalInventory).totalQuantity !== undefined;
}

export function StockTable(props: StockTableProps) {
  const mode = props.mode;
  const isLoading = props.isLoading;
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');

  // Get unique suppliers from items (hook must be unconditional)
  const uniqueSuppliers = useMemo(() => {
    const supplierMap = new Map<number, { id: number; name: string }>();
    props.items.forEach((item) => {
      const supplier = isGlobalInventory(item) ? item.supplier : item.supplier;
      if (supplier && !supplierMap.has(supplier.id)) {
        supplierMap.set(supplier.id, supplier);
      }
    });
    return Array.from(supplierMap.values());
  }, [props.items]);

  const filteredItems = useMemo(() => {
    let filtered: Array<GlobalInventory | Stock> = props.items;

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
  }, [props.items, search, supplierFilter, ownershipFilter]);

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
                const drink = item.drink;
                const supplier = isGlobalInventory(item) ? item.supplier : item.supplier;
                const quantity = isGlobalInventory(item) ? item.totalQuantity : item.quantity;
                const availableQuantity = isGlobalInventory(item)
                  ? item.totalQuantity - item.allocatedQuantity
                  : undefined;

                const itemKey = isGlobalInventory(item)
                  ? item.id
                  : `${item.barId}-${item.drinkId}-${item.supplierId}`;

                return (
                  <TableRow key={itemKey}>
                    <TableCell className="font-medium">
                      {drink?.name || `Drink ${item.drinkId}`}
                    </TableCell>
                    <TableCell>
                      {supplier?.name ||
                        (isGlobalInventory(item)
                          ? item.supplierId
                            ? `Supplier ${item.supplierId}`
                            : 'Sin proveedor'
                          : `Supplier ${item.supplierId}`)}
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
                            {isGlobalInventory(item) ? item.allocatedQuantity : 0}
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
                      {mode === 'global' && isGlobalInventory(item) ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {'onAssign' in props && props.onAssign && (
                              <DropdownMenuItem onClick={() => props.onAssign!(item)}>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Asignar a barra
                              </DropdownMenuItem>
                            )}
                            {'onViewMovements' in props &&
                              props.onViewMovements && (
                                <DropdownMenuItem
                                  onClick={() => props.onViewMovements!(item)}
                                >
                                  Ver movimientos
                                </DropdownMenuItem>
                              )}
                            {'onEdit' in props && props.onEdit && (
                              <DropdownMenuItem onClick={() => props.onEdit!(item)}>
                                Editar
                              </DropdownMenuItem>
                            )}
                            {'onDelete' in props && props.onDelete && (
                              <DropdownMenuItem
                                onClick={() => (props as any).onDelete(item)}
                                className="text-destructive"
                              >
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        !isGlobalInventory(item) && (
                          <div className="flex gap-2">
                            {'onMove' in props && props.onMove && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => props.onMove!(item)}
                              >
                                <ArrowUpDown className="h-4 w-4" />
                                <span className="text-xs">Mover a otra barra</span>
                              </Button>
                            )}
                            {'onReturn' in props && props.onReturn && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => props.onReturn!(item)}
                              >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-xs">Devolver a global</span>
                              </Button>
                            )}
                          </div>
                        )
                      )}
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
