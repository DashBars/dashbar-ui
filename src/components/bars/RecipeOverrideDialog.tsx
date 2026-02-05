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
  useCreateRecipeOverride,
  useUpdateRecipeOverride,
} from '@/hooks/useRecipeOverrides';
import type { RecipeOverride } from '@/lib/api/types';

interface RecipeOverrideDialogProps {
  eventId: number;
  barId: number;
  override: RecipeOverride | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeOverrideDialog({
  eventId,
  barId,
  override,
  open,
  onOpenChange,
}: RecipeOverrideDialogProps) {
  const isEdit = !!override;
  const createOverride = useCreateRecipeOverride(eventId, barId);
  const updateOverride = useUpdateRecipeOverride(
    eventId,
    barId,
    override?.id || 0
  );

  const [cocktailId, setCocktailId] = useState(0);
  const [drinkId, setDrinkId] = useState(0);
  const [cocktailPercentage, setCocktailPercentage] = useState(0);

  useEffect(() => {
    if (override) {
      setCocktailId(override.cocktailId);
      setDrinkId(override.drinkId);
      setCocktailPercentage(override.cocktailPercentage);
    } else {
      setCocktailId(0);
      setDrinkId(0);
      setCocktailPercentage(0);
    }
  }, [override, open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEdit) {
      updateOverride.mutate(
        { cocktailPercentage },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createOverride.mutate(
        { cocktailId, drinkId, cocktailPercentage },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit Recipe Override' : 'Create Recipe Override'}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the recipe override percentage.'
                : 'Create a recipe override for this bar.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!isEdit && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="cocktailId">Cocktail ID</Label>
                  <Input
                    id="cocktailId"
                    type="number"
                    min="1"
                    value={cocktailId || ''}
                    onChange={(e) => setCocktailId(parseInt(e.target.value) || 0)}
                    required
                    placeholder="Cocktail ID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="drinkId">Drink ID</Label>
                  <Input
                    id="drinkId"
                    type="number"
                    min="1"
                    value={drinkId || ''}
                    onChange={(e) => setDrinkId(parseInt(e.target.value) || 0)}
                    required
                    placeholder="Drink ID"
                  />
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label htmlFor="cocktailPercentage">Cocktail Percentage (%)</Label>
              <Input
                id="cocktailPercentage"
                type="number"
                min="1"
                max="100"
                value={cocktailPercentage || ''}
                onChange={(e) => setCocktailPercentage(parseInt(e.target.value) || 0)}
                required
                placeholder="1-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createOverride.isPending || updateOverride.isPending}
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
