import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useActivateEvent } from '@/hooks/useEvents';
import { useBars } from '@/hooks/useBars';
import type { Bar } from '@/lib/api/types';
import type { Event } from '@/lib/api/types';
import { Play, Loader2, AlertTriangle } from 'lucide-react';

interface RecipeWarning {
  recipeName: string;
  barType: string;
  barId: number;
  barName: string;
  missingDrinks: string[];
}

interface ActivateEventDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeWarnings?: RecipeWarning[];
}

export function ActivateEventDialog({
  event,
  open,
  onOpenChange,
  recipeWarnings = [],
}: ActivateEventDialogProps) {
  const { mutate: activateEvent, isPending } = useActivateEvent();
  const { data: bars = [], isLoading: isLoadingBars } = useBars(event.id);
  const [openAllBars, setOpenAllBars] = useState(true);
  const [selectedBarIds, setSelectedBarIds] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setOpenAllBars(true);
      setSelectedBarIds([]);
    }
  }, [open]);

  const handleConfirm = () => {
    const barIds = openAllBars ? undefined : selectedBarIds;
    activateEvent(
      {
        id: event.id,
        dto: { barIds },
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const handleBarToggle = (barId: number, checked: boolean) => {
    if (checked) {
      setSelectedBarIds([...selectedBarIds, barId]);
    } else {
      setSelectedBarIds(selectedBarIds.filter((id) => id !== barId));
    }
    setOpenAllBars(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Activar Evento</DialogTitle>
          <DialogDescription>
            ¿Deseas abrir todas las barras al activar "{event.name}"?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="openAll"
              checked={openAllBars}
              onCheckedChange={(checked) => {
                setOpenAllBars(checked === true);
                if (checked) {
                  setSelectedBarIds([]);
                }
              }}
              disabled={isPending || isLoadingBars}
            />
            <Label
              htmlFor="openAll"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Abrir todas las barras
            </Label>
          </div>

          {!openAllBars && (
            <div className="space-y-2 border rounded-lg p-4">
              <Label className="text-sm font-medium">
                Seleccionar barras a abrir:
              </Label>
              {isLoadingBars ? (
                <p className="text-sm text-muted-foreground">Cargando barras...</p>
              ) : bars.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay barras en este evento
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bars.map((bar: Bar) => (
                    <div key={bar.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bar-${bar.id}`}
                        checked={selectedBarIds.includes(bar.id)}
                        onCheckedChange={(checked) =>
                          handleBarToggle(bar.id, checked === true)
                        }
                        disabled={isPending}
                      />
                      <Label
                        htmlFor={`bar-${bar.id}`}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {bar.name} ({bar.type})
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {recipeWarnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-800">
                  No se puede activar el evento
                </p>
                <p className="text-xs text-amber-700">
                  Hay recetas con insumos faltantes en barras. Cargá el stock necesario antes de activar.
                </p>
                <ul className="text-xs text-amber-700 space-y-0.5 mt-1">
                  {recipeWarnings.map((w) => (
                    <li key={`${w.recipeName}-${w.barId}`}>
                      <span className="font-medium">{w.recipeName}</span>
                      {' en '}
                      <span className="font-medium">{w.barName}</span>
                      {' ('}
                      <span className="capitalize">{w.barType}</span>
                      {'): faltan '}
                      {w.missingDrinks.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || recipeWarnings.length > 0 || (!openAllBars && selectedBarIds.length === 0)}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activar Evento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
