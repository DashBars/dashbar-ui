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
import { Loader2 } from 'lucide-react';
import { useCreatePosnet, useUpdatePosnet } from '@/hooks/usePosnets';
import { useBars } from '@/hooks/useBars';
import type { Posnet, PosnetStatus, Bar } from '@/lib/api/types';

interface PosFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  editingPosnet?: Posnet | null;
  defaultBarId?: number;
}

export function PosFormDialog({
  open,
  onOpenChange,
  eventId,
  editingPosnet,
  defaultBarId,
}: PosFormDialogProps) {
  const [name, setName] = useState('');
  const [barId, setBarId] = useState<string>('');
  const [status, setStatus] = useState<PosnetStatus>('CLOSED');

  const { data: bars = [] } = useBars(eventId);
  const createPosnet = useCreatePosnet(eventId);
  const updatePosnet = useUpdatePosnet(editingPosnet?.id ?? 0, eventId);

  const isEditing = !!editingPosnet;
  const isLoading = createPosnet.isPending || updatePosnet.isPending;
  const hasDefaultBar = defaultBarId != null;

  // Reset form when dialog opens/closes or editingPosnet changes
  useEffect(() => {
    if (open) {
      if (editingPosnet) {
        setName(editingPosnet.name);
        setBarId(String(editingPosnet.barId));
        setStatus(editingPosnet.status);
      } else {
        setName('');
        setBarId(defaultBarId != null ? String(defaultBarId) : '');
        setStatus('CLOSED');
      }
    }
  }, [open, editingPosnet, defaultBarId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && editingPosnet) {
      await updatePosnet.mutateAsync({
        name,
        status,
      });
    } else {
      await createPosnet.mutateAsync({
        name,
        barId: Number(barId),
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Terminal POS' : 'Crear Terminal POS'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza los detalles del terminal POS'
              : 'Agrega un nuevo terminal POS'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Terminal</Label>
            <Input
              id="name"
              placeholder="ej: POS Bar VIP 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="barId">Barra</Label>
              <Select
                value={barId}
                onValueChange={setBarId}
                required
                disabled={isLoading || hasDefaultBar}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar barra" />
                </SelectTrigger>
                <SelectContent>
                  {bars.map((bar: Bar) => (
                    <SelectItem key={bar.id} value={String(bar.id)}>
                      {bar.name} ({bar.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasDefaultBar && (
                <p className="text-xs text-muted-foreground">
                  La barra está preseleccionada
                </p>
              )}
            </div>
          )}

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PosnetStatus)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Abierto</SelectItem>
                  <SelectItem value="CONGESTED">Congestionado</SelectItem>
                  <SelectItem value="CLOSED">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || (!isEditing && !barId)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </>
              ) : isEditing ? (
                'Guardar Cambios'
              ) : (
                'Crear Terminal'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
