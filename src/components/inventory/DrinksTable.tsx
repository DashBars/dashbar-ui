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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Drink } from '@/lib/api/types';

interface DrinksTableProps {
  drinks: Drink[];
  isLoading?: boolean;
  onEdit: (drink: Drink) => void;
  onDelete: (drink: Drink) => void;
}

export function DrinksTable({
  drinks,
  isLoading,
  onEdit,
  onDelete,
}: DrinksTableProps) {
  const [search, setSearch] = useState('');

  const filteredDrinks = useMemo(() => {
    if (!search) return drinks;
    const lowerSearch = search.toLowerCase();
    return drinks.filter(
      (d) =>
        d.name.toLowerCase().includes(lowerSearch) ||
        d.brand.toLowerCase().includes(lowerSearch) ||
        d.sku.toLowerCase().includes(lowerSearch),
    );
  }, [drinks, search]);

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
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
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
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrinks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron insumos
                </TableCell>
              </TableRow>
            ) : (
              filteredDrinks.map((drink) => (
                <TableRow key={drink.id}>
                  <TableCell className="font-medium">{drink.name}</TableCell>
                  <TableCell>{drink.brand}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {drink.sku}
                    </code>
                  </TableCell>
                  <TableCell>{drink.volume}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {drink.drinkType === 'alcoholic' ? 'Alcohólica' : 'No Alcohólica'}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => onEdit(drink)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(drink)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
