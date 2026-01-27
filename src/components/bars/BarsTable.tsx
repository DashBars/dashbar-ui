import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Package, ChefHat } from 'lucide-react';
import type { Bar } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface BarsTableProps {
  bars: Bar[] | undefined;
  isLoading: boolean;
  onViewDetails: (bar: Bar) => void;
  onEdit: (bar: Bar) => void;
  onManageStock: (bar: Bar) => void;
  onManageRecipes: (bar: Bar) => void;
}

const barTypeColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  VIP: 'default',
  general: 'secondary',
  backstage: 'outline',
  lounge: 'secondary',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  open: 'default',
  closed: 'secondary',
  lowStock: 'destructive',
};

export function BarsTable({
  bars,
  isLoading,
  onViewDetails,
  onEdit,
  onManageStock,
  onManageRecipes,
}: BarsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bars || bars.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No hay bars configurados para este evento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>POS</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bars.map((bar) => (
              <TableRow
                key={bar.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onViewDetails(bar)}
              >
                <TableCell className="font-medium">{bar.name}</TableCell>
                <TableCell>
                  <Badge variant={barTypeColors[bar.type] || 'default'}>
                    {bar.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusColors[bar.status] || 'default'}>
                    {bar.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {bar.posnets && bar.posnets.length > 0 ? (
                    <Badge variant="outline">{bar.posnets.length}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {bar.stocks && bar.stocks.length > 0 ? (
                    <Badge variant="outline">
                      {bar.stocks.length} item{bar.stocks.length !== 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => onViewDetails(bar)}
                    className="h-8"
                  >
                    Gestionar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
