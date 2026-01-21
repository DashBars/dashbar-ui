import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateVenue, useUpdateVenue } from '@/hooks/useVenues';
import type { Venue, CreateVenueDto, UpdateVenueDto } from '@/lib/api/types';
import { Loader2 } from 'lucide-react';

interface VenueFormDialogProps {
  venue?: Venue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VenueFormDialog({
  venue,
  open,
  onOpenChange,
}: VenueFormDialogProps) {
  const isEdit = !!venue;
  const { mutate: createVenue, isPending: isCreating } = useCreateVenue();
  const { mutate: updateVenue, isPending: isUpdating } = useUpdateVenue(
    venue?.id || 0,
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [capacity, setCapacity] = useState<string>('');

  useEffect(() => {
    if (open) {
      setName(venue?.name || '');
      setDescription(venue?.description || '');
      setAddress(venue?.address || '');
      setCity(venue?.city || '');
      setCountry(venue?.country || '');
      setCapacity(venue?.capacity?.toString() || '');
    }
  }, [open, venue]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEdit) {
      const dto: UpdateVenueDto = {
        name,
        description: description || undefined,
        address,
        city,
        country,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
      };
      updateVenue(dto, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      const dto: CreateVenueDto = {
        name,
        description: description || undefined,
        address,
        city,
        country,
        capacity: parseInt(capacity, 10),
      };
      createVenue(dto, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Venue' : 'New Venue'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update venue information.'
              : 'Create a new venue. It will be assigned to your account automatically.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Venue name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="Country"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">
                Capacity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Maximum capacity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
