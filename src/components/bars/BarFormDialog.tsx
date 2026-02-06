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
import type { Bar, BarType, BarStatus } from '@/lib/api/types';
import { useCreateBar, useUpdateBar } from '@/hooks/useBars';

interface BarFormDialogProps {
  eventId: number;
  bar: Bar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarFormDialog({
  eventId,
  bar,
  open,
  onOpenChange,
}: BarFormDialogProps) {
  const isEdit = !!bar;
  const createBar = useCreateBar(eventId);
  const updateBar = useUpdateBar(eventId, bar?.id || 0);

  const [name, setName] = useState('');
  const [type, setType] = useState<BarType>('general');
  const [status, setStatus] = useState<BarStatus>('closed');

  useEffect(() => {
    if (bar) {
      setName(bar.name);
      setType(bar.type);
      setStatus(bar.status);
    } else {
      setName('');
      setType('general');
      setStatus('closed');
    }
  }, [bar, open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEdit) {
      updateBar.mutate(
        { name, type, status },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createBar.mutate(
        { name, type, status },
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
            <DialogTitle>{isEdit ? 'Edit Bar' : 'Create Bar'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the bar details below.'
                : 'Create a new bar for this event.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Bar name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as BarType)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="backstage">Backstage</SelectItem>
                  <SelectItem value="lounge">Lounge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isEdit ? (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as BarStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="lowStock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value="closed" disabled>
                  <SelectTrigger id="status" className="bg-muted text-muted-foreground">
                    <SelectValue placeholder="Closed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Las barras se crean cerradas. Podrás abrirlas al activar el evento.
                </p>
              </div>
            )}
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
              disabled={createBar.isPending || updateBar.isPending}
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
