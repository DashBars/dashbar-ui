import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Key,
  Copy,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeletePosnet, useRotatePosnetToken } from '@/hooks/usePosnets';
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
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

export function PosTable({ posnets, eventId, onEdit }: PosTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [rotateTokenId, setRotateTokenId] = useState<number | null>(null);

  const deletePosnet = useDeletePosnet(eventId);
  const rotateToken = useRotatePosnetToken(rotateTokenId ?? 0);

  const handleDelete = async () => {
    if (deleteId) {
      await deletePosnet.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleRotateToken = async () => {
    if (rotateTokenId) {
      const result = await rotateToken.mutateAsync();
      // Copy new token to clipboard
      await navigator.clipboard.writeText(result.authToken);
      toast.success('New token copied to clipboard');
      setRotateTokenId(null);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const openKiosk = (posnetId: number) => {
    window.open(`/pos/${posnetId}/kiosk`, '_blank');
  };

  if (posnets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No POS terminals configured</p>
        <p className="text-sm">Create a terminal to get started</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Bar</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Traffic</TableHead>
            <TableHead>Last Heartbeat</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posnets.map((posnet) => (
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
              <TableCell>{posnet.bar?.name || `Bar #${posnet.barId}`}</TableCell>
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
                    <DropdownMenuItem onClick={() => openKiosk(posnet.id)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Kiosk
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyCode(posnet.code)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(posnet)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRotateTokenId(posnet.id)}>
                      <Key className="h-4 w-4 mr-2" />
                      Rotate Token
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteId(posnet.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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
            <AlertDialogTitle>Delete POS Terminal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The terminal will be permanently removed and
              any active sessions will be terminated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rotate Token Confirmation */}
      <AlertDialog
        open={rotateTokenId !== null}
        onOpenChange={() => setRotateTokenId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate Authentication Token?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new authentication token and invalidate the current
              one. The terminal will need to re-authenticate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotateToken}>
              Rotate Token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
