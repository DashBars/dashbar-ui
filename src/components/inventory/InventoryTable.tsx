import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableTableHead, useTableSort, sortItems } from '@/components/ui/sortable-table-head';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2, ArrowRight, Eye } from 'lucide-react';
import type { ManagerInventory } from '@/lib/api/types';

interface InventoryTableProps {
  inventory: ManagerInventory[];
  isLoading?: boolean;
  onEdit: (item: ManagerInventory) => void;
  onDelete: (item: ManagerInventory) => void;
  onTransfer: (item: ManagerInventory) => void;
  onViewAllocations: (item: ManagerInventory) => void;
}

export function InventoryTable({
  inventory,
  isLoading,
  onEdit,
  onDelete,
  onTransfer,
  onViewAllocations,
}: InventoryTableProps) {
  const [search, setSearch] = useState('');
  const { sortKey, sortDir, handleSort } = useTableSort();

  const filteredInventory = useMemo(() => {
    if (!search) return inventory;
    const lowerSearch = search.toLowerCase();
    return inventory.filter(
      (item) =>
        item.drink.name.toLowerCase().includes(lowerSearch) ||
        item.drink.brand.toLowerCase().includes(lowerSearch) ||
        item.supplier.name.toLowerCase().includes(lowerSearch) ||
        item.sku?.toLowerCase().includes(lowerSearch),
    );
  }, [inventory, search]);

  const sortGetters: Record<string, (item: ManagerInventory) => string | number | null | undefined> = {
    name: (item) => item.drink.name.toLowerCase(),
    brand: (item) => item.drink.brand.toLowerCase(),
    sku: (item) => item.sku || item.drink.sku || '',
    volume: (item) => item.drink.volume,
    supplier: (item) => item.supplier.name.toLowerCase(),
    total: (item) => item.totalQuantity,
    available: (item) => item.totalQuantity - item.allocatedQuantity,
    allocated: (item) => item.allocatedQuantity,
  };

  const sortedInventory = useMemo(
    () => sortItems(filteredInventory, sortKey, sortDir, sortGetters),
    [filteredInventory, sortKey, sortDir],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Input placeholder="Buscar insumos..." disabled className="max-w-sm" />
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Volumen</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Cantidad Total</TableHead>
                <TableHead>Disponible</TableHead>
                <TableHead>Asignada</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
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
      <Input
        placeholder="Buscar insumos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sortKey="name" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Nombre</SortableTableHead>
              <SortableTableHead sortKey="brand" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Marca</SortableTableHead>
              <SortableTableHead sortKey="sku" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>SKU</SortableTableHead>
              <SortableTableHead sortKey="volume" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Volumen (ml)</SortableTableHead>
              <SortableTableHead sortKey="supplier" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Proveedor</SortableTableHead>
              <SortableTableHead sortKey="total" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Cantidad Total</SortableTableHead>
              <SortableTableHead sortKey="available" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Disponible</SortableTableHead>
              <SortableTableHead sortKey="allocated" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Asignada</SortableTableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No se encontraron insumos
                </TableCell>
              </TableRow>
            ) : (
              sortedInventory.map((item) => {
                const availableQuantity = item.totalQuantity - item.allocatedQuantity;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.drink.name}</TableCell>
                    <TableCell>{item.drink.brand}</TableCell>
                    <TableCell>{item.sku || item.drink.sku || '-'}</TableCell>
                    <TableCell>{item.drink.volume}</TableCell>
                    <TableCell>{item.supplier.name}</TableCell>
                    <TableCell>{item.totalQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={availableQuantity > 0 ? 'default' : 'secondary'}>
                        {availableQuantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.allocatedQuantity}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onTransfer(item)} disabled={availableQuantity === 0}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Transferir a barra
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewAllocations(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver distribución
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(item)}
                            className="text-destructive"
                            disabled={item.allocatedQuantity > 0}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
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
