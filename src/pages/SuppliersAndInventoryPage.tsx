import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSuppliers, useDeleteSupplier } from '@/hooks/useSuppliers';
import { useGlobalInventory, useDeleteGlobalInventory } from '@/hooks/useGlobalInventory';
import { SuppliersTable } from '@/components/suppliers/SuppliersTable';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { DrinksTable } from '@/components/inventory/DrinksTable';
import { StockTable } from '@/components/inventory/StockTable';
import { DrinkFormDialog } from '@/components/inventory/DrinkFormDialog';
import { AddStockDialog } from '@/components/inventory/AddStockDialog';
import { GlobalInventoryMovementsDialog } from '@/components/inventory/GlobalInventoryMovementsDialog';
import { AssignStockDialog } from '@/components/inventory/AssignStockDialog';
import { useDrinks, useDeleteDrink } from '@/hooks/useDrinks';
import type { Supplier, GlobalInventory, Drink } from '@/lib/api/types';
import { Plus, ArrowRight, Package } from 'lucide-react';

export function SuppliersAndInventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'suppliers');

  // Sync tab from URL on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['suppliers', 'inventory', 'global-stock'].includes(tabParam)) {
      setActiveTab(tabParam);
      // Clean up the param
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Suppliers state
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const { mutate: deleteSupplier } = useDeleteSupplier();
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteSupplierDialogOpen, setDeleteSupplierDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Drinks (Insumos) state
  const { data: drinks = [], isLoading: isLoadingDrinks } = useDrinks();
  const { mutate: deleteDrink } = useDeleteDrink();
  const [drinkFormOpen, setDrinkFormOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
  const [deleteDrinkDialogOpen, setDeleteDrinkDialogOpen] = useState(false);
  const [drinkToDelete, setDrinkToDelete] = useState<Drink | null>(null);

  // Global Inventory (Stock) state
  const { data: globalInventory = [], isLoading: isLoadingInventory } =
    useGlobalInventory();
  const { mutate: deleteInventory } = useDeleteGlobalInventory();
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [editingInventory, setEditingInventory] =
    useState<GlobalInventory | null>(null);
  const [deleteInventoryDialogOpen, setDeleteInventoryDialogOpen] = useState(false);
  const [inventoryToDelete, setInventoryToDelete] =
    useState<GlobalInventory | null>(null);

  // Suppliers handlers
  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierFormOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormOpen(true);
  };

  const handleDeleteSupplierClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteSupplierDialogOpen(true);
  };

  const handleDeleteSupplierConfirm = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      setDeleteSupplierDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  // Drinks handlers
  const handleCreateDrink = () => {
    setEditingDrink(null);
    setDrinkFormOpen(true);
  };

  const handleEditDrink = (drink: Drink) => {
    setEditingDrink(drink);
    setDrinkFormOpen(true);
  };

  const handleDeleteDrinkClick = (drink: Drink) => {
    setDrinkToDelete(drink);
    setDeleteDrinkDialogOpen(true);
  };

  const handleDeleteDrinkConfirm = () => {
    if (drinkToDelete) {
      deleteDrink(drinkToDelete.id);
      setDeleteDrinkDialogOpen(false);
      setDrinkToDelete(null);
    }
  };

  // Global Inventory (Stock) handlers
  const handleAddStock = () => {
    setEditingInventory(null);
    setAddStockDialogOpen(true);
  };

  const handleEditInventory = (item: GlobalInventory) => {
    setEditingInventory(item);
    setAddStockDialogOpen(true);
  };

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [inventoryToAssign, setInventoryToAssign] = useState<GlobalInventory | null>(null);
  const [movementsDialogOpen, setMovementsDialogOpen] = useState(false);
  const [inventoryForMovements, setInventoryForMovements] = useState<GlobalInventory | null>(null);

  const handleAssignToBar = (item: GlobalInventory) => {
    setInventoryToAssign(item);
    setAssignDialogOpen(true);
  };

  const handleViewMovements = (item: GlobalInventory) => {
    setInventoryForMovements(item);
    setMovementsDialogOpen(true);
  };

  const handleDeleteInventoryClick = (item: GlobalInventory) => {
    setInventoryToDelete(item);
    setDeleteInventoryDialogOpen(true);
  };

  const handleDeleteInventoryConfirm = () => {
    if (inventoryToDelete) {
      deleteInventory(inventoryToDelete.id);
      setDeleteInventoryDialogOpen(false);
      setInventoryToDelete(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Proveedores e Insumos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus proveedores e inventario global de insumos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="inventory">Insumos</TabsTrigger>
          <TabsTrigger value="global-stock">Stock en Inventario Global</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateSupplier}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo proveedor
            </Button>
          </div>

          {suppliers.length === 0 && !isLoadingSuppliers ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-lg font-medium text-muted-foreground mb-4">
                  No hay proveedores aún
                </p>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Comienza agregando tu primer proveedor. Podrás vincular recibos
                  de stock a proveedores y rastrear devoluciones de consignación.
                </p>
                <Button onClick={handleCreateSupplier}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar tu primer proveedor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <SuppliersTable
              suppliers={suppliers}
              isLoading={isLoadingSuppliers}
              onEdit={handleEditSupplier}
              onDelete={handleDeleteSupplierClick}
            />
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Insumos Definidos</h2>
              <p className="text-sm text-muted-foreground">
                Define los insumos (bebidas) que usarás en tu inventario
              </p>
            </div>
            <Button onClick={handleCreateDrink}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Insumo
            </Button>
          </div>

          {drinks.length === 0 && !isLoadingDrinks ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium text-muted-foreground mb-4">
                  No hay insumos definidos aún
                </p>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Primero define los insumos (bebidas) que usarás. Luego podrás
                  agregar stock de esos insumos.
                </p>
                <Button onClick={handleCreateDrink}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear tu primer insumo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DrinksTable
              drinks={drinks}
              isLoading={isLoadingDrinks}
              onEdit={handleEditDrink}
              onDelete={handleDeleteDrinkClick}
            />
          )}
        </TabsContent>

        <TabsContent value="global-stock" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Stock en Inventario Global</h2>
              <p className="text-sm text-muted-foreground">
                Registra las compras de insumos que has realizado
              </p>
            </div>
            {globalInventory.length > 0 && (
              <Button onClick={handleAddStock}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar o reabastecer stock
              </Button>
            )}
          </div>

          {globalInventory.length === 0 && !isLoadingInventory ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  No hay stock en inventario global
                </p>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Registra las compras de insumos que has realizado. Luego podrás
                  asignarlos a las barras de tus eventos.
                </p>
                {drinks.length === 0 ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground text-center">
                      Para agregar stock, primero necesitás crear al menos un insumo.
                    </p>
                    <Button onClick={() => setActiveTab('inventory')}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Ir a crear insumos
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleAddStock}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar tu primer stock
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <StockTable
              items={globalInventory}
              isLoading={isLoadingInventory}
              mode="global"
              onAssign={handleAssignToBar}
              onEdit={handleEditInventory}
              onDelete={handleDeleteInventoryClick}
              onViewMovements={handleViewMovements}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Suppliers Dialogs */}
      <SupplierFormDialog
        supplier={editingSupplier}
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
      />

      <Dialog
        open={deleteSupplierDialogOpen}
        onOpenChange={setDeleteSupplierDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Proveedor</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar "{supplierToDelete?.name}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteSupplierDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSupplierConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drinks Dialogs */}
      <DrinkFormDialog
        drink={editingDrink}
        open={drinkFormOpen}
        onOpenChange={setDrinkFormOpen}
      />

      <Dialog
        open={deleteDrinkDialogOpen}
        onOpenChange={setDeleteDrinkDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Insumo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar "{drinkToDelete?.name}"? Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDrinkDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteDrinkConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inventory (Stock) Dialogs */}
      <AddStockDialog
        inventory={editingInventory}
        open={addStockDialogOpen}
        onOpenChange={setAddStockDialogOpen}
      />

      <GlobalInventoryMovementsDialog
        inventory={inventoryForMovements}
        open={movementsDialogOpen}
        onOpenChange={(open) => {
          setMovementsDialogOpen(open);
          if (!open) setInventoryForMovements(null);
        }}
      />

      <Dialog
        open={deleteInventoryDialogOpen}
        onOpenChange={setDeleteInventoryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Insumo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este insumo del inventario?
              Solo puedes eliminar insumos que no tengan cantidades asignadas.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteInventoryDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteInventoryConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {inventoryToAssign && (
        <AssignStockDialog
          inventory={inventoryToAssign}
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) setInventoryToAssign(null);
          }}
        />
      )}
    </div>
  );
}
