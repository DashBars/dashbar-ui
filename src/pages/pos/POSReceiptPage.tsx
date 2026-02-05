import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { posDeviceApi } from '@/lib/api/dashbar';

export function POSReceiptPage() {
  const { posnetId, saleId } = useParams<{ posnetId: string; saleId: string }>();

  const { data: receipt, isLoading, error } = useQuery({
    queryKey: ['pos-receipt', posnetId, saleId],
    queryFn: () => posDeviceApi.getReceipt(Number(posnetId), Number(saleId)),
    enabled: !!posnetId && !!saleId,
  });

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(cents / 100);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load receipt</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden max-w-md mx-auto mb-4 flex gap-2 px-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handlePrint} className="flex-1">
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      {/* Receipt */}
      <div className="max-w-md mx-auto bg-white shadow-lg print:shadow-none">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="text-center border-b border-dashed pb-4">
            <h1 className="text-xl font-bold">{receipt.eventName}</h1>
            <p className="text-gray-600">{receipt.barName}</p>
            <p className="text-sm text-gray-500">{receipt.posnetName}</p>
          </div>

          {/* Receipt Info */}
          <div className="text-sm text-gray-600 space-y-1 border-b border-dashed pb-4">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-mono">{receipt.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDate(receipt.createdAt)}</span>
            </div>
            {receipt.cashierName && (
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{receipt.cashierName}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2 border-b border-dashed pb-4">
            <h3 className="font-semibold text-sm uppercase text-gray-500">Items</h3>
            {receipt.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{item.quantity}x</span>{' '}
                  <span>{item.name}</span>
                </div>
                <span>{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(receipt.subtotal)}</span>
            </div>
            {receipt.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(receipt.tax)}</span>
              </div>
            )}
            {receipt.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(receipt.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-dashed pt-2 mt-2">
              <span>TOTAL</span>
              <span>{formatCurrency(receipt.total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="text-center text-sm text-gray-600 border-t border-dashed pt-4">
            <p className="uppercase font-medium">
              Paid by {receipt.paymentMethod}
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 pt-4">
            <p>Thank you for your purchase!</p>
            <p className="mt-2">
              Sale ID: {receipt.saleId}
            </p>
          </div>

          {/* Barcode placeholder */}
          <div className="flex justify-center pt-4">
            <div className="bg-gray-100 px-8 py-2 rounded">
              <p className="font-mono text-sm">{receipt.receiptNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
