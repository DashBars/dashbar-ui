import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSuppliers, useDeleteSupplier } from '@/hooks/useSuppliers';
import { SuppliersTable } from '@/components/suppliers/SuppliersTable';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import type { Supplier } from '@/lib/api/types';
import { Plus } from 'lucide-react';

export function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { mutate: deleteSupplier } = useDeleteSupplier();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const handleCreate = () => {
    setEditingSupplier(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground mt-1">
            Gestioná tus proveedores y su información de contacto
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo proveedor
        </Button>
      </div>

      {suppliers.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-muted-foreground mb-4">
              Todavía no hay proveedores
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Empezá agregando tu primer proveedor. Vas a poder vincular compras de stock y hacer seguimiento de consignaciones.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Agregá tu primer proveedor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SuppliersTable
          suppliers={suppliers}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      )}

      <SupplierFormDialog
        supplier={editingSupplier}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Proveedor</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar "{supplierToDelete?.name}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
