import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Posnet } from '@/lib/api/types';

interface PosnetsTabProps {
  posnets: Posnet[];
}

export function PosnetsTab({ posnets }: PosnetsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>POS Devices</CardTitle>
          <CardDescription>
            POS devices are managed at the system level. This is a read-only view
            of devices assigned to this bar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posnets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No POS devices assigned to this bar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Traffic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posnets.map((posnet) => (
                  <TableRow key={posnet.id}>
                    <TableCell className="font-medium">#{posnet.id}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          posnet.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {posnet.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{posnet.traffic}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
