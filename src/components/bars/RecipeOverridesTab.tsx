import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  useRecipeOverrides,
  useDeleteRecipeOverride,
} from '@/hooks/useRecipeOverrides';
import { RecipeOverrideDialog } from './RecipeOverrideDialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { RecipeOverride } from '@/lib/api/types';

interface RecipeOverridesTabProps {
  eventId: number;
  barId: number;
}

export function RecipeOverridesTab({
  eventId,
  barId,
}: RecipeOverridesTabProps) {
  const { data: overrides, isLoading } = useRecipeOverrides(eventId, barId);
  const deleteOverride = useDeleteRecipeOverride(eventId, barId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] =
    useState<RecipeOverride | null>(null);

  const handleCreate = () => {
    setEditingOverride(null);
    setDialogOpen(true);
  };

  const handleEdit = (override: RecipeOverride) => {
    setEditingOverride(override);
    setDialogOpen(true);
  };

  const handleDelete = (override: RecipeOverride) => {
    if (
      confirm(
        `Are you sure you want to delete the recipe override for ${override.cocktail?.name}?`
      )
    ) {
      deleteOverride.mutate(override.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Override recipes for this specific bar. These take precedence over
          event-level recipes.
        </p>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Override
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Overrides</CardTitle>
        </CardHeader>
        <CardContent>
          {!overrides || overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recipe overrides configured. Add one to customize recipes for
              this bar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cocktail</TableHead>
                  <TableHead>Drink</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.map((override) => (
                  <TableRow key={override.id}>
                    <TableCell className="font-medium">
                      {override.cocktail?.name || `Cocktail ${override.cocktailId}`}
                    </TableCell>
                    <TableCell>
                      {override.drink?.name || `Drink ${override.drinkId}`}
                    </TableCell>
                    <TableCell>{override.cocktailPercentage}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(override)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(override)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RecipeOverrideDialog
        eventId={eventId}
        barId={barId}
        override={editingOverride}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
