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
import { MoreHorizontal, ArrowRight, ArrowLeft, ArrowUpDown, Package, Beaker } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Separate bar stock by sellAsWholeUnit
  const directSaleItems = useMemo(() => {
    if (mode !== 'bar') return [];
    return (filteredItems as Stock[]).filter((item) => item.sellAsWholeUnit === true);
  }, [mode, filteredItems]);

  const recipeItems = useMemo(() => {
    if (mode !== 'bar') return [];
    return (filteredItems as Stock[]).filter((item) => item.sellAsWholeUnit === false);
  }, [mode, filteredItems]);

  const formatCurrency = (amount: number, currency: string = 'ARS') => {
    return `${currency} ${(amount / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /** Format stock quantity: show units (bottles) + ml if drink volume is available */
  const formatStockQuantity = (item: Stock) => {
    const drinkVolume = item.drink?.volume;
    if (drinkVolume && drinkVolume > 0) {
      const units = Math.floor(item.quantity / drinkVolume);
      const remainder = item.quantity % drinkVolume;
      return (
        <div>
          <div className="font-medium">{units} {units === 1 ? 'unidad' : 'unidades'}</div>
          <div className="text-xs text-muted-foreground">
            {(item.quantity / 1000).toFixed(1)} L
            {remainder > 0 && ` (${remainder} ml sueltos)`}
          </div>
        </div>
      );
    }
    return <span>{item.quantity}</span>;
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
                <TableHead>Insumo</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Cantidad</TableHead>
                {mode === 'global' && <TableHead>Disponible</TableHead>}
                {mode === 'global' && <TableHead>Asignada</TableHead>}
                <TableHead>Costo Unit.</TableHead>
                <TableHead>Propiedad</TableHead>
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

  // Helper to render bar stock action menu (three-dot dropdown)
  const renderBarActions = (item: Stock) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {'onMove' in props && props.onMove && (
          <DropdownMenuItem onClick={() => props.onMove!(item)}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Mover a otra barra
          </DropdownMenuItem>
        )}
        {'onReturn' in props && props.onReturn && (
          <DropdownMenuItem onClick={() => props.onReturn!(item)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Devolver al almacén
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Helper function to render direct sale stock table (with sale price)
  const renderDirectSaleTable = (items: Stock[], emptyMessage: string) => (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Insumo</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Costo Unit.</TableHead>
            <TableHead>Precio Venta</TableHead>
            <TableHead>Propiedad</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-16 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const itemKey = `${item.barId}-${item.drinkId}-${item.supplierId}-${item.sellAsWholeUnit}`;
              return (
                <TableRow key={itemKey}>
                  <TableCell className="font-medium">
                    {item.drink?.name || `Insumo ${item.drinkId}`}
                  </TableCell>
                  <TableCell>
                    {item.supplier?.name || `Proveedor ${item.supplierId}`}
                  </TableCell>
                  <TableCell>{formatStockQuantity(item)}</TableCell>
                  <TableCell>
                    {formatCurrency(item.unitCost, item.currency || 'ARS')}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {item.salePrice ? formatCurrency(item.salePrice, item.currency || 'ARS') : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.ownershipMode === 'consignment' ? 'secondary' : 'outline'}
                    >
                      {item.ownershipMode === 'consignment' ? 'Consignación' : 'Comprado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {renderBarActions(item)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Helper function to render recipe stock table (without sale price)
  const renderRecipeTable = (items: Stock[], emptyMessage: string) => (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Insumo</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Costo Unit.</TableHead>
            <TableHead>Propiedad</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-16 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const itemKey = `${item.barId}-${item.drinkId}-${item.supplierId}-${item.sellAsWholeUnit}`;
              return (
                <TableRow key={itemKey}>
                  <TableCell className="font-medium">
                    {item.drink?.name || `Insumo ${item.drinkId}`}
                  </TableCell>
                  <TableCell>
                    {item.supplier?.name || `Proveedor ${item.supplierId}`}
                  </TableCell>
                  <TableCell>{formatStockQuantity(item)}</TableCell>
                  <TableCell>
                    {formatCurrency(item.unitCost, item.currency || 'ARS')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.ownershipMode === 'consignment' ? 'secondary' : 'outline'}
                    >
                      {item.ownershipMode === 'consignment' ? 'Consignación' : 'Comprado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {renderBarActions(item)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Bar mode: render two separate sections
  if (mode === 'bar') {
    return (
      <div className="space-y-6">
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

        {/* Side by side: Direct Sale + Recipe Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Direct Sale Stock */}
          <Card className="rounded-2xl flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-green-600" />
                Venta directa
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Se venden como unidad completa
              </p>
            </CardHeader>
            <CardContent className="pt-0 flex-1 min-h-0">
              <div className="max-h-[40vh] overflow-y-auto rounded-lg">
                {renderDirectSaleTable(directSaleItems, 'No hay insumos para venta directa')}
              </div>
            </CardContent>
          </Card>

          {/* Recipe Components Stock */}
          <Card className="rounded-2xl flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Beaker className="h-5 w-5 text-blue-600" />
                Para recetas
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Ingredientes para preparar cocktails
              </p>
            </CardHeader>
            <CardContent className="pt-0 flex-1 min-h-0">
              <div className="max-h-[40vh] overflow-y-auto rounded-lg">
                {renderRecipeTable(recipeItems, 'No hay insumos para recetas')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Global mode: render single table
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
              <TableHead>Insumo</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Disponible</TableHead>
              <TableHead>Asignada</TableHead>
              <TableHead>Costo Unit.</TableHead>
              <TableHead>Propiedad</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron items
                </TableCell>
              </TableRow>
            ) : (
              (filteredItems as GlobalInventory[]).map((item) => {
                const drink = item.drink;
                const supplier = item.supplier;
                const availableQuantity = item.totalQuantity - item.allocatedQuantity;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {drink?.name || `Insumo ${item.drinkId}`}
                    </TableCell>
                    <TableCell>
                      {supplier?.name ||
                        (item.supplierId ? `Proveedor ${item.supplierId}` : 'Sin proveedor')}
                    </TableCell>
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
                      {formatCurrency(item.unitCost, item.currency || 'ARS')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.ownershipMode === 'consignment' ? 'secondary' : 'outline'}
                      >
                        {item.ownershipMode === 'consignment' ? 'Consignación' : 'Comprado'}
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
                          {'onAssign' in props && props.onAssign && (
                            <DropdownMenuItem
                              onClick={() => props.onAssign!(item)}
                              disabled={availableQuantity <= 0}
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Asignar a barra
                            </DropdownMenuItem>
                          )}
                          {'onViewMovements' in props && props.onViewMovements && (
                            <DropdownMenuItem onClick={() => props.onViewMovements!(item)}>
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
                              onClick={() => props.onDelete!(item)}
                              className="text-destructive"
                              disabled={item.allocatedQuantity > 0}
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
