import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableTableHead, useTableSort, sortItems } from '@/components/ui/sortable-table-head';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeletePosnet } from '@/hooks/usePosnets';
import { posDeviceApi } from '@/lib/api/dashbar';
import type { Posnet, PosnetStatus } from '@/lib/api/types';

interface PosTableProps {
  posnets: Posnet[];
  eventId: number;
  onEdit: (posnet: Posnet) => void;
}

function StatusBadge({ status }: { status: PosnetStatus }) {
  const variants: Record<PosnetStatus, 'default' | 'outline' | 'secondary' | 'destructive'> =
    {
      OPEN: 'default',
      CONGESTED: 'outline',
      CLOSED: 'secondary',
    };

  const colors: Record<PosnetStatus, string> = {
    OPEN: 'bg-green-500/10 text-green-500 border-green-500/20',
    CONGESTED: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    CLOSED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status}
    </Badge>
  );
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return 'Nunca';
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s atrás`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m atrás`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h atrás`;
  return date.toLocaleDateString();
}

const posnetSortGetters: Record<string, (item: Posnet) => string | number | null | undefined> = {
  name: (item) => item.name?.toLowerCase(),
  code: (item) => item.code?.toLowerCase(),
  bar: (item) => item.bar?.name?.toLowerCase(),
  status: (item) => item.status?.toLowerCase(),
  traffic: (item) => item.traffic,
  lastHeartbeatAt: (item) =>
    item.lastHeartbeatAt ? new Date(item.lastHeartbeatAt).getTime() : null,
};

export function PosTable({ posnets, eventId, onEdit }: PosTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { sortKey, sortDir, handleSort } = useTableSort();
  const sortedItems = useMemo(
    () => sortItems(posnets, sortKey, sortDir, posnetSortGetters),
    [posnets, sortKey, sortDir],
  );

  const deletePosnet = useDeletePosnet(eventId);

  const handleDelete = async () => {
    if (deleteId) {
      await deletePosnet.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  const openKiosk = async (posnet: Posnet) => {
    try {
      // Auto-login to POS using the posnet code
      const response = await posDeviceApi.login(posnet.code);
      localStorage.setItem('pos_token', response.accessToken);
      localStorage.setItem('pos_id', String(response.posnet.id));
      localStorage.setItem('pos_name', response.posnet.name);
      window.open(`/pos/${posnet.id}/kiosk`, '_blank');
    } catch {
      toast.error('No se pudo abrir el kiosco. Verifica que el POS esté habilitado.');
    }
  };

  if (posnets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay terminales POS configurados</p>
        <p className="text-sm">Creá un terminal para empezar</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              sortKey="name"
              currentSort={sortKey}
              currentDirection={sortDir}
              onSort={handleSort}
            >
              Nombre
            </SortableTableHead>
            <SortableTableHead
              sortKey="code"
              currentSort={sortKey}
              currentDirection={sortDir}
              onSort={handleSort}
            >
              Código
            </SortableTableHead>
            <SortableTableHead
              sortKey="bar"
              currentSort={sortKey}
              currentDirection={sortDir}
              onSort={handleSort}
            >
              Barra
            </SortableTableHead>
            <SortableTableHead
              sortKey="status"
              currentSort={sortKey}
              currentDirection={sortDir}
              onSort={handleSort}
            >
              Estado
            </SortableTableHead>
            <SortableTableHead
              sortKey="traffic"
              currentSort={sortKey}
              currentDirection={sortDir}
              onSort={handleSort}
            >
              Tráfico
            </SortableTableHead>
            <SortableTableHead
              sortKey="lastHeartbeatAt"
              currentSort={sortKey}
              currentDirection={sortDir}
              onSort={handleSort}
            >
              Última Señal
            </SortableTableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((posnet) => (
            <TableRow key={posnet.id}>
              <TableCell className="font-medium">{posnet.name}</TableCell>
              <TableCell>
                <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                  {posnet.code}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1"
                  onClick={() => copyCode(posnet.code)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TableCell>
              <TableCell>{posnet.bar?.name || 'Barra desconocida'}</TableCell>
              <TableCell>
                <StatusBadge status={posnet.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        posnet.traffic > 80
                          ? 'bg-red-500'
                          : posnet.traffic > 50
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(posnet.traffic, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {posnet.traffic}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatRelativeTime(posnet.lastHeartbeatAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openKiosk(posnet)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Kiosko
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyCode(posnet.code)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Código
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(posnet)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteId(posnet.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Terminal POS?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El terminal se eliminará permanentemente y las sesiones activas se terminarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
