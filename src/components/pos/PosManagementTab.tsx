import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Monitor, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEventPosnets } from '@/hooks/usePosnets';
import { PosTable } from './PosTable';
import { PosFormDialog } from './PosFormDialog';
import type { Posnet } from '@/lib/api/types';

interface PosManagementTabProps {
  eventId: number;
}

export function PosManagementTab({ eventId }: PosManagementTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosnet, setEditingPosnet] = useState<Posnet | null>(null);

  const { data: posnets = [], isLoading } = useEventPosnets(eventId);

  // Calculate stats
  const openCount = posnets.filter((p) => p.status === 'OPEN').length;
  const congestedCount = posnets.filter((p) => p.status === 'CONGESTED').length;
  const avgTraffic =
    posnets.length > 0
      ? Math.round(posnets.reduce((sum, p) => sum + p.traffic, 0) / posnets.length)
      : 0;

  const handleEdit = (posnet: Posnet) => {
    setEditingPosnet(posnet);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPosnet(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Terminals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{posnets.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{openCount}</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Congested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{congestedCount}</span>
              {congestedCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                >
                  Warning
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Traffic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp
                className={`h-5 w-5 ${
                  avgTraffic > 80
                    ? 'text-red-500'
                    : avgTraffic > 50
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}
              />
              <span className="text-2xl font-bold">{avgTraffic}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* POS List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>POS Terminals</CardTitle>
            <CardDescription>
              Manage point-of-sale terminals for this event
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Terminal
          </Button>
        </CardHeader>
        <CardContent>
          <PosTable posnets={posnets} eventId={eventId} onEdit={handleEdit} />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <PosFormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        eventId={eventId}
        editingPosnet={editingPosnet}
      />
    </div>
  );
}
