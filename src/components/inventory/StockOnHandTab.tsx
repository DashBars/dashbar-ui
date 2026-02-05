import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockSummary } from '@/hooks/useStock';
import { stockApi } from '@/lib/api/dashbar';
import { useQuery } from '@tanstack/react-query';
import { useSuppliers } from '@/hooks/useSuppliers';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { OwnershipMode } from '@/lib/api/types';

interface StockOnHandTabProps {
  eventId: number;
  barId: number;
}

export function StockOnHandTab({ eventId, barId }: StockOnHandTabProps) {
  const { data: summary = [], isLoading: summaryLoading } = useStockSummary(
    eventId,
    barId,
  );
  const { data: stockBySupplier = [], isLoading: stockLoading } = useQuery({
    queryKey: ['stock', 'by-supplier', eventId, barId],
    queryFn: () => stockApi.getStockBySupplier(eventId, barId),
    enabled: !!eventId && !!barId,
  });
  const { data: suppliers = [] } = useSuppliers();

  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<number | 'all'>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipMode | 'all'>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const filteredSummary = useMemo(() => {
    let filtered = summary;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.drinkName.toLowerCase().includes(lowerSearch) ||
          s.drinkBrand.toLowerCase().includes(lowerSearch),
      );
    }

    return filtered;
  }, [summary, search]);

  const getStockBreakdown = (drinkId: number) => {
    return stockBySupplier.filter((s) => {
      if (s.drinkId !== drinkId) return false;
      if (supplierFilter !== 'all' && s.supplierId !== supplierFilter) return false;
      if (ownershipFilter !== 'all' && s.ownershipMode !== ownershipFilter) return false;
      return true;
    });
  };

  const toggleRow = (drinkId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(drinkId)) {
      newExpanded.delete(drinkId);
    } else {
      newExpanded.add(drinkId);
    }
    setExpandedRows(newExpanded);
  };

  const isLoading = summaryLoading || stockLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Suppliers</TableHead>
                <TableHead>Valuation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={supplierFilter === 'all' ? 'all' : String(supplierFilter)}
          onValueChange={(value) =>
            setSupplierFilter(value === 'all' ? 'all' : Number(value))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={ownershipFilter}
          onValueChange={(value) =>
            setOwnershipFilter(value as OwnershipMode | 'all')
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by ownership" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ownership</SelectItem>
            <SelectItem value="purchased">Purchased</SelectItem>
            <SelectItem value="consignment">Consignment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Total Quantity</TableHead>
              <TableHead>Suppliers</TableHead>
              <TableHead>Valuation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSummary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No stock found
                </TableCell>
              </TableRow>
            ) : (
              filteredSummary.map((item) => {
                const breakdown = getStockBreakdown(item.drinkId);
                const isExpanded = expandedRows.has(item.drinkId);
                const hasBreakdown = breakdown.length > 0;

                return (
                  <>
                    <TableRow key={item.drinkId}>
                      <TableCell>
                        {hasBreakdown && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRow(item.drinkId)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{item.drinkName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.drinkBrand}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.totalQuantity}</TableCell>
                      <TableCell>{item.supplierCount} suppliers</TableCell>
                      <TableCell>
                        {breakdown.length > 0
                          ? breakdown
                              .reduce((sum, s) => sum + (s.unitCost * s.quantity) / 100, 0)
                              .toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                          : '-'}
                      </TableCell>
                    </TableRow>
                    {isExpanded &&
                      breakdown.map((stock) => (
                        <TableRow
                          key={`${stock.drinkId}-${stock.supplierId}`}
                          className="bg-muted/50"
                        >
                          <TableCell></TableCell>
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {stock.supplier?.name || 'Unknown'}
                              </span>
                              <Badge
                                variant={
                                  stock.ownershipMode === 'consignment'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {stock.ownershipMode}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{stock.quantity}</TableCell>
                          <TableCell>
                            {stock.supplier?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {stock.currency} {((stock.unitCost * stock.quantity) / 100).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({stock.currency} {(stock.unitCost / 100).toFixed(2)}/unit)
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
