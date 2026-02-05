import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockSummary, useStock } from '@/hooks/useStock';
import { stockApi } from '@/lib/api/dashbar';
import { useQuery } from '@tanstack/react-query';
import { Plus, ArrowLeft } from 'lucide-react';
import { useEvent } from '@/hooks/useEvents';
import { useBar } from '@/hooks/useBars';
import { useState } from 'react';
import { InventoryReceiptDialog } from '@/components/inventory/InventoryReceiptDialog';
import { StockOnHandTab } from '@/components/inventory/StockOnHandTab';
import { ReceiptsTab } from '@/components/inventory/ReceiptsTab';
import { ConsignmentReturnsTab } from '@/components/inventory/ConsignmentReturnsTab';

export function BarInventoryPage() {
  const { eventId, barId } = useParams<{ eventId: string; barId: string }>();
  const eventIdNum = parseInt(eventId || '0', 10);
  const barIdNum = parseInt(barId || '0', 10);
  const navigate = useNavigate();
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const { data: event } = useEvent(eventIdNum);
  const { data: bar } = useBar(eventIdNum, barIdNum);

  const { data: summary = [], isLoading: summaryLoading } = useStockSummary(
    eventIdNum,
    barIdNum,
  );
  const { data: stock = [], isLoading: stockLoading } = useStock(
    eventIdNum,
    barIdNum,
  );
  const { data: consignmentStock = [] } = useQuery({
    queryKey: ['stock', 'consignment', eventIdNum, barIdNum],
    queryFn: () => stockApi.getConsignmentStock(eventIdNum, barIdNum),
    enabled: !!eventIdNum && !!barIdNum,
  });

  // Calculate summary metrics
  const totalItems = summary.length;
  const totalQuantity = summary.reduce((sum, s) => sum + s.totalQuantity, 0);
  const consignmentCount = consignmentStock.length;
  const uniqueSuppliers = new Set(stock.map((s) => s.supplierId)).size;

  // Calculate valuation grouped by currency
  const valuationByCurrency = stock.reduce((acc, s) => {
    const currency = s.currency || 'ARS';
    const total = (s.unitCost * s.quantity) / 100; // Convert cents to currency units
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += total;
    return acc;
  }, {} as Record<string, number>);

  const isLoading = summaryLoading || stockLoading;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => navigate(`/events/${eventIdNum}/bars/${barIdNum}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
            <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link to="/events" className="hover:text-foreground transition-colors">
                Events
              </Link>
              <span className="mx-2">/</span>
              <Link
                to={`/events/${eventIdNum}`}
                className="hover:text-foreground transition-colors"
              >
                {event?.name || `Event ${eventIdNum}`}
              </Link>
              <span className="mx-2">/</span>
              <Link
                to={`/events/${eventIdNum}/bars/${barIdNum}`}
                className="hover:text-foreground transition-colors"
              >
                {bar?.name || `Bar ${barIdNum}`}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">Inventory</span>
            </nav>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bar Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage stock, receipts, and consignment returns
          </p>
        </div>
        <Button onClick={() => setReceiptDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add stock
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalItems}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {totalQuantity} units total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Valuation</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                {Object.entries(valuationByCurrency).map(([currency, amount]) => (
                  <div key={currency} className="text-2xl font-bold">
                    {currency} {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                ))}
                {Object.keys(valuationByCurrency).length === 0 && (
                  <div className="text-sm text-muted-foreground">No cost data</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consignment Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{consignmentCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Items on consignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{uniqueSuppliers}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Suppliers with stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="on-hand" className="space-y-4">
        <TabsList>
          <TabsTrigger value="on-hand">On Hand</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="consignment-returns">Consignment Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="on-hand" className="space-y-4">
          <StockOnHandTab eventId={eventIdNum} barId={barIdNum} />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <ReceiptsTab eventId={eventIdNum} barId={barIdNum} />
        </TabsContent>

        <TabsContent value="consignment-returns" className="space-y-4">
          <ConsignmentReturnsTab eventId={eventIdNum} barId={barIdNum} />
        </TabsContent>
      </Tabs>

      <InventoryReceiptDialog
        eventId={eventIdNum}
        barId={barIdNum}
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
      />
    </div>
  );
}
