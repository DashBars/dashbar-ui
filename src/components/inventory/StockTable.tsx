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
import { MoreHorizontal, ArrowRight, ArrowLeft, ArrowUpDown, Package, Beaker, ChevronDown, ChevronUp } from 'lucide-react';
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

/** Collapsible stacked layout for bar stock sections */
function BarStockView({
  search,
  onSearchChange,
  supplierFilter,
  onSupplierFilterChange,
  ownershipFilter,
  onOwnershipFilterChange,
  uniqueSuppliers,
  directSaleItems,
  recipeItems,
  renderDirectSaleTable,
  renderRecipeTable,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  supplierFilter: string;
  onSupplierFilterChange: (v: string) => void;
  ownershipFilter: string;
  onOwnershipFilterChange: (v: string) => void;
  uniqueSuppliers: Array<{ id: number; name: string }>;
  directSaleItems: Stock[];
  recipeItems: Stock[];
  renderDirectSaleTable: (items: Stock[], emptyMessage: string) => JSX.Element;
  renderRecipeTable: (items: Stock[], emptyMessage: string) => JSX.Element;
}) {
  const [showDirectSale, setShowDirectSale] = useState(true);
  const [showRecipe, setShowRecipe] = useState(true);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por nombre, marca, proveedor..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
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
        <Select value={ownershipFilter} onValueChange={onOwnershipFilterChange}>
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

      {/* Direct Sale Section — collapsible */}
      <Card className="rounded-2xl">
        <CardHeader
          className="cursor-pointer select-none py-4"
          onClick={() => setShowDirectSale((p) => !p)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Venta directa</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Se venden como unidad completa
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {directSaleItems.length}
              </Badge>
              {showDirectSale ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        {showDirectSale && (
          <CardContent className="pt-0">
            {renderDirectSaleTable(directSaleItems, 'No hay insumos para venta directa')}
          </CardContent>
        )}
      </Card>

      {/* Recipe Stock Section — collapsible */}
      <Card className="rounded-2xl">
        <CardHeader
          className="cursor-pointer select-none py-4"
          onClick={() => setShowRecipe((p) => !p)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Beaker className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Para recetas</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Ingredientes para preparar cocktails
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {recipeItems.length}
              </Badge>
              {showRecipe ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        {showRecipe && (
          <CardContent className="pt-0">
            {renderRecipeTable(recipeItems, 'No hay insumos para recetas')}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function StockTable(props: StockTableProps) {
  const mode = props.mode;
  const isLoading = props.isLoading;
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');
  const { sortKey, sortDir, handleSort } = useTableSort();

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

  // Sort getters for GlobalInventory
  const globalSortGetters: Record<string, (item: GlobalInventory) => string | number | null | undefined> = {
    name: (item) => item.drink?.name?.toLowerCase(),
    supplier: (item) => item.supplier?.name?.toLowerCase(),
    quantity: (item) => item.totalQuantity,
    available: (item) => item.totalQuantity - item.allocatedQuantity,
    allocated: (item) => item.allocatedQuantity,
    cost: (item) => item.unitCost,
    ownership: (item) => item.ownershipMode,
  };

  // Sort getters for Stock
  const stockSortGetters: Record<string, (item: Stock) => string | number | null | undefined> = {
    name: (item) => item.drink?.name?.toLowerCase(),
    supplier: (item) => item.supplier?.name?.toLowerCase(),
    quantity: (item) => item.quantity,
    cost: (item) => item.unitCost,
    salePrice: (item) => item.salePrice ?? 0,
    ownership: (item) => item.ownershipMode,
  };

  // Apply sorting
  const sortedItems = useMemo(() => {
    if (mode === 'global') {
      return sortItems(filteredItems as GlobalInventory[], sortKey, sortDir, globalSortGetters);
    }
    return sortItems(filteredItems as Stock[], sortKey, sortDir, stockSortGetters);
  }, [filteredItems, sortKey, sortDir, mode]);

  // Separate bar stock by sellAsWholeUnit
  const directSaleItems = useMemo(() => {
    if (mode !== 'bar') return [];
    return (sortedItems as Stock[]).filter((item) => item.sellAsWholeUnit === true);
  }, [mode, sortedItems]);

  const recipeItems = useMemo(() => {
    if (mode !== 'bar') return [];
    return (sortedItems as Stock[]).filter((item) => item.sellAsWholeUnit === false);
  }, [mode, sortedItems]);

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
            <SortableTableHead sortKey="name" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Insumo</SortableTableHead>
            <SortableTableHead sortKey="supplier" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Proveedor</SortableTableHead>
            <SortableTableHead sortKey="quantity" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Cantidad</SortableTableHead>
            <SortableTableHead sortKey="cost" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Costo Unit.</SortableTableHead>
            <SortableTableHead sortKey="salePrice" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Precio Venta</SortableTableHead>
            <SortableTableHead sortKey="ownership" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Propiedad</SortableTableHead>
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
                  <TableCell>
                    <div className="font-medium">{item.drink?.name || `Insumo ${item.drinkId}`}</div>
                    {item.drink?.brand && (
                      <div className="text-xs text-muted-foreground">
                        {item.drink.brand} — {item.drink.volume}ml
                      </div>
                    )}
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
            <SortableTableHead sortKey="name" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Insumo</SortableTableHead>
            <SortableTableHead sortKey="supplier" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Proveedor</SortableTableHead>
            <SortableTableHead sortKey="quantity" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Cantidad</SortableTableHead>
            <SortableTableHead sortKey="cost" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Costo Unit.</SortableTableHead>
            <SortableTableHead sortKey="ownership" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Propiedad</SortableTableHead>
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
                  <TableCell>
                    <div className="font-medium">{item.drink?.name || `Insumo ${item.drinkId}`}</div>
                    {item.drink?.brand && (
                      <div className="text-xs text-muted-foreground">
                        {item.drink.brand} — {item.drink.volume}ml
                      </div>
                    )}
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

  // Bar mode: render two collapsible stacked sections
  if (mode === 'bar') {
    return <BarStockView
      search={search}
      onSearchChange={setSearch}
      supplierFilter={supplierFilter}
      onSupplierFilterChange={setSupplierFilter}
      ownershipFilter={ownershipFilter}
      onOwnershipFilterChange={setOwnershipFilter}
      uniqueSuppliers={uniqueSuppliers}
      directSaleItems={directSaleItems}
      recipeItems={recipeItems}
      renderDirectSaleTable={renderDirectSaleTable}
      renderRecipeTable={renderRecipeTable}
    />;
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
              <SortableTableHead sortKey="name" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Insumo</SortableTableHead>
              <SortableTableHead sortKey="supplier" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Proveedor</SortableTableHead>
              <SortableTableHead sortKey="quantity" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Cantidad</SortableTableHead>
              <SortableTableHead sortKey="available" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Disponible</SortableTableHead>
              <SortableTableHead sortKey="allocated" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Asignada</SortableTableHead>
              <SortableTableHead sortKey="cost" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Costo Unit.</SortableTableHead>
              <SortableTableHead sortKey="ownership" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort}>Propiedad</SortableTableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron items
                </TableCell>
              </TableRow>
            ) : (
              (sortedItems as GlobalInventory[]).map((item) => {
                const drink = item.drink;
                const supplier = item.supplier;
                const availableQuantity = item.totalQuantity - item.allocatedQuantity;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{drink?.name || `Insumo ${item.drinkId}`}</div>
                      {drink?.brand && (
                        <div className="text-xs text-muted-foreground">
                          {drink.brand} — {drink.volume}ml
                        </div>
                      )}
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
