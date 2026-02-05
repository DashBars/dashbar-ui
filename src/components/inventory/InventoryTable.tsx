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
              <TableHead>Nombre</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Volumen (ml)</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Cantidad Total</TableHead>
              <TableHead>Disponible</TableHead>
              <TableHead>Asignada</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No se encontraron insumos
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
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
