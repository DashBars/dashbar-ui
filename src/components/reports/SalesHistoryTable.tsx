import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventSalesApi } from '@/lib/api/dashbar';
import type { POSSale } from '@/lib/api/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShoppingCart,
  Receipt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SalesHistoryTableProps {
  eventId: number;
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function SalesHistoryTable({ eventId }: SalesHistoryTableProps) {
  const [page, setPage] = useState(1);
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['event-sales', eventId, page, limit],
    queryFn: () => eventSalesApi.getSales(eventId, page, limit),
    placeholderData: (prev) => prev,
  });

  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm">No se registraron ventas en este evento</p>
      </div>
    );
  }

  const { sales, total, totalPages } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'venta' : 'ventas'} registradas
        </p>
        <p className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Barra</TableHead>
              <TableHead>POS</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Fecha/Hora</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale: POSSale) => {
              const isExpanded = expandedSale === sale.id;
              const itemNames = sale.items
                .map((i) => `${i.productNameSnapshot}${i.quantity > 1 ? ` x${i.quantity}` : ''}`)
                .join(', ');
              const totalItems = sale.items.reduce((s, i) => s + i.quantity, 0);
              const paymentMethod = sale.payments?.[0]?.method || 'N/A';

              return (
                <Fragment key={sale.id}>
                  <TableRow
                    className={`cursor-pointer hover:bg-muted/40 transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}
                    onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {sale.id}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium truncate block max-w-[250px]" title={itemNames}>
                        {itemNames}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sale.bar?.name || `Barra ${sale.barId}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sale.posnet?.name || `POS ${sale.posnetId}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        x{totalItems}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <PaymentBadge method={paymentMethod} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${sale.id}-detail`} className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={9} className="py-3 px-6">
                        <SaleDetail sale={sale} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            {getPageNumbers(page, totalPages).map((p, idx) =>
              p === '...' ? (
                <span key={`dots-${idx}`} className="px-2 text-xs text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              ),
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──

function PaymentBadge({ method }: { method: string }) {
  const labels: Record<string, { label: string; className: string }> = {
    cash: { label: 'Efectivo', className: 'bg-green-50 text-green-700 border-green-200' },
    credit: { label: 'Crédito', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    debit: { label: 'Débito', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    bankTransfer: { label: 'Transfer.', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    wallet: { label: 'Billetera', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  };

  const info = labels[method] || { label: method, className: '' };
  return (
    <Badge variant="outline" className={`text-[10px] ${info.className}`}>
      {info.label}
    </Badge>
  );
}

function SaleDetail({ sale }: { sale: POSSale }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Receipt className="h-3.5 w-3.5" />
        <span>Detalle de venta #{sale.id}</span>
      </div>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-right">Precio unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-sm">{item.productNameSnapshot}</TableCell>
                <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                <TableCell className="text-right text-sm">{formatCurrency(item.unitPriceSnapshot)}</TableCell>
                <TableCell className="text-right text-sm font-medium">{formatCurrency(item.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm px-2">
        <span className="text-muted-foreground">
          Subtotal: {formatCurrency(sale.subtotal)}
          {sale.tax > 0 && ` | Impuestos: ${formatCurrency(sale.tax)}`}
        </span>
        <span className="font-semibold">Total: {formatCurrency(sale.total)}</span>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}
