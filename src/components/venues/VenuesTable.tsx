import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import type { Venue, VenueType } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

interface VenuesTableProps {
  venues: Venue[];
  isLoading?: boolean;
  onEdit: (venue: Venue) => void;
  onDelete: (venue: Venue) => void;
  onView?: (venue: Venue) => void;
  editingVenueId?: number | null;
}

function formatCapacity(capacity: number): string {
  return capacity.toLocaleString('en-US');
}

function VenueTypeBadge({ type }: { type: VenueType }) {
  const variants = {
    outdoor: 'bg-green-100 text-green-800 border-green-200',
    indoor: 'bg-blue-100 text-blue-800 border-blue-200',
    nose: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const labels = {
    outdoor: 'Al aire libre',
    indoor: 'Interior',
    nose: 'No especificado',
  };

  return (
    <Badge variant="outline" className={variants[type] || variants.nose}>
      {labels[type] || labels.nose}
    </Badge>
  );
}

export function VenuesTable({
  venues,
  isLoading,
  onEdit,
  onDelete,
  onView,
  editingVenueId,
}: VenuesTableProps) {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>País</TableHead>
            <TableHead>Capacidad</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>País</TableHead>
            <TableHead>Capacidad</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No se encontraron sedes
              </TableCell>
            </TableRow>
          ) : (
            venues.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell className="font-medium">{venue.name}</TableCell>
                  <TableCell>
                    <VenueTypeBadge type={venue.venueType} />
                  </TableCell>
                  <TableCell>{venue.city}</TableCell>
                  <TableCell>{venue.country}</TableCell>
                  <TableCell>{formatCapacity(venue.capacity)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              'block max-w-md truncate cursor-help',
                              venue.address.length > 40 && 'text-muted-foreground',
                            )}
                          >
                            {venue.address}
                          </span>
                        </TooltipTrigger>
                        {venue.address.length > 40 && (
                          <TooltipContent>
                            <p>{venue.address}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(venue)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(venue)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(venue)}
                          className="text-destructive"
                          disabled={editingVenueId === venue.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
  );
}
