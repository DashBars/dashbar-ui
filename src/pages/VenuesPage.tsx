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
          <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground mt-1">
            Manage your venues and locations
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create venue
        </Button>
      </div>

      {venues.length === 0 && !isLoading ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-muted-foreground mb-4">
              You don't have any venues yet
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Get started by creating your first venue. You'll be able to use it when creating events.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first venue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-0">
            <VenuesTable
              venues={venues}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          </CardContent>
        </Card>
      )}

      <VenueFormDialog
        venue={editingVenue}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Venue</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{venueToDelete?.name}"? This action
              cannot be undone. If this venue has associated events, the deletion will fail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
