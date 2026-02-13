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
import { Loader2, AlertCircle } from 'lucide-react';

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
  const [formError, setFormError] = useState<string | null>(null);

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
      setFormError(null);
    }
  }, [open, venue]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

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
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'Error al actualizar la sede';
          setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        },
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
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'Error al crear la sede';
          setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        },
      });
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Sede' : 'Nueva Sede'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualizá la información de la sede.'
              : 'Creá una nueva sede. Se asignará a tu cuenta automáticamente.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Nombre de la sede"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">
                Dirección <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Dirección"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  Ciudad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="Ciudad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Provincia</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Provincia"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">
                  País <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="País"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Código postal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueType">Tipo de sede</Label>
              <Select
                value={venueType}
                onValueChange={(value) => setVenueType(value as VenueType)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="venueType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outdoor">Al aire libre</SelectItem>
                  <SelectItem value="indoor">Interior</SelectItem>
                  <SelectItem value="nose">No especificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">
                Capacidad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Capacidad máxima"
              />
            </div>
          </div>
          {formError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive mt-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                isEdit ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
