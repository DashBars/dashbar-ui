import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useVenues, useDeleteVenue } from '@/hooks/useVenues';
import { VenuesTable } from '@/components/venues/VenuesTable';
import { VenueFormDialog } from '@/components/venues/VenueFormDialog';
import type { Venue } from '@/lib/api/types';
import { Plus } from 'lucide-react';

export function VenuesPage() {
  const { data: venues = [], isLoading } = useVenues();
  const { mutate: deleteVenue } = useDeleteVenue();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);
  const [search, setSearch] = useState('');

  const filteredVenues = useMemo(() => {
    if (!search) return venues;
    const lowerSearch = search.toLowerCase();
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(lowerSearch) ||
        v.city.toLowerCase().includes(lowerSearch) ||
        v.country.toLowerCase().includes(lowerSearch) ||
        v.address.toLowerCase().includes(lowerSearch),
    );
  }, [venues, search]);

  const handleCreate = () => {
    setEditingVenue(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (venue: Venue) => {
    setVenueToDelete(venue);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (venueToDelete) {
      deleteVenue(venueToDelete.id);
      setDeleteDialogOpen(false);
      setVenueToDelete(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sedes</h1>
          <p className="text-muted-foreground mt-1">
            Gestioná tus sedes y ubicaciones
          </p>
        </div>
        {venues.length > 0 && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Crear sede
          </Button>
        )}
      </div>

      {venues.length === 0 && !isLoading ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-muted-foreground mb-4">
              Todavía no tenés sedes
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Empezá creando tu primera sede. Vas a poder usarla al crear eventos.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Creá tu primera sede
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="Buscar sedes por nombre, ciudad, país o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-0">
              <VenuesTable
                venues={filteredVenues}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                editingVenueId={formDialogOpen ? editingVenue?.id : null}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <VenueFormDialog
        venue={editingVenue}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Sede</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                ¿Estás seguro de que querés eliminar "{venueToDelete?.name}"?
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Restricciones:</strong> Solo podés eliminar una sede si no tiene eventos asignados,
                o si todos sus eventos están en estado "próximo". Si tiene eventos activos o finalizados,
                primero tenés que eliminarlos o archivarlos.
              </p>
              <p className="text-sm text-destructive font-medium">
                Esta acción no se puede deshacer.
              </p>
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
