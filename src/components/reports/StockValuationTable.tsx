import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import type { StockValuationSummary } from '@/lib/api/types';
import { Package, ChevronDown, ChevronUp, Boxes, Handshake } from 'lucide-react';

interface StockValuationTableProps {
  data: StockValuationSummary;
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StockValuationTable({ data }: StockValuationTableProps) {
  const [expandedBar, setExpandedBar] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Valuación de Stock Restante
        </CardTitle>
        <CardDescription>
          Inventario remanente con valuación por tipo de propiedad
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-slate-600" />
              <span className="text-sm text-muted-foreground">Valor Total</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.totalValue)}</div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Boxes className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Comprado</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.purchasedValue)}</div>
            <div className="text-xs text-muted-foreground">
              {data.totalValue > 0 ? ((data.purchasedValue / data.totalValue) * 100).toFixed(1) : 0}% del total
            </div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Handshake className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Consignación</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.consignmentValue)}</div>
            <div className="text-xs text-muted-foreground">
              {data.totalValue > 0 ? ((data.consignmentValue / data.totalValue) * 100).toFixed(1) : 0}% del total
            </div>
          </div>
        </div>

        {/* Per-bar breakdown */}
        {data.byBar.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barra</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Comprado</TableHead>
                  <TableHead className="text-right">Consignación</TableHead>
                  <TableHead className="text-right">Insumos</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byBar.map((bar) => (
                  <>
                    <TableRow key={bar.barId}>
                      <TableCell className="font-medium">{bar.barName}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(bar.totalValue)}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(bar.purchasedValue)}</TableCell>
                      <TableCell className="text-right text-purple-600">{formatCurrency(bar.consignmentValue)}</TableCell>
                      <TableCell className="text-right">{bar.items.length}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedBar(expandedBar === bar.barId ? null : bar.barId)}
                        >
                          {expandedBar === bar.barId ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedBar === bar.barId && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-slate-50 dark:bg-slate-900 p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-8">Insumo</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Costo Unit.</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead>Tipo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bar.items.map((item, index) => (
                                <TableRow key={`${bar.barId}-${item.drinkId}-${index}`}>
                                  <TableCell className="pl-8">{item.drinkName}</TableCell>
                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                                  <TableCell className="text-right font-medium">{formatCurrency(item.value)}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        item.ownershipMode === 'purchased'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                      }
                                    >
                                      {item.ownershipMode === 'purchased' ? 'Comprado' : 'Consignación'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay stock restante para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
