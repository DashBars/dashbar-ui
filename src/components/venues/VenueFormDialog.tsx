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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateVenue, useUpdateVenue } from '@/hooks/useVenues';
import type { Venue, CreateVenueDto, UpdateVenueDto, VenueType } from '@/lib/api/types';
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
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [venueType, setVenueType] = useState<VenueType>('nose');

  useEffect(() => {
    if (open) {
      setName(venue?.name || '');
      setAddress(venue?.address || '');
      setCity(venue?.city || '');
      setState(venue?.state || '');
      setCountry(venue?.country || '');
      setPostalCode(venue?.postalCode || '');
      setCapacity(venue?.capacity?.toString() || '');
      setVenueType(venue?.venueType || 'nose');
    }
  }, [open, venue]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEdit) {
      const dto: UpdateVenueDto = {
        name,
        address,
        city,
        state: state || undefined,
        country,
        postalCode: postalCode || undefined,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        venueType,
      };
      updateVenue(dto, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      const dto: CreateVenueDto = {
        name,
        address,
        city,
        state: state || undefined,
        country,
        postalCode: postalCode || undefined,
        capacity: parseInt(capacity, 10),
        venueType,
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
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
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
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="State or province"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Postal code"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueType">Venue Type</Label>
              <Select
                value={venueType}
                onValueChange={(value) => setVenueType(value as VenueType)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="venueType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="nose">No especificado</SelectItem>
                </SelectContent>
              </Select>
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
          <DialogFooter className="mt-6">
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
