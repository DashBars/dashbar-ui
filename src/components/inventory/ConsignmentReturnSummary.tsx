import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import type { ConsignmentReturnSummary } from '@/lib/api/types';

interface ConsignmentReturnSummaryProps {
  groupedBySupplier: Array<{
    supplierId: number;
    supplierName: string;
    items: ConsignmentReturnSummary[];
  }>;
  onExecuteReturn: (item: ConsignmentReturnSummary) => void;
  isExecuting: boolean;
}

export function ConsignmentReturnSummary({
  groupedBySupplier,
  onExecuteReturn,
  isExecuting,
}: ConsignmentReturnSummaryProps) {
  return (
    <Accordion type="multiple" className="w-full">
      {groupedBySupplier.map(({ supplierId, supplierName, items }) => {
        const totalToReturn = items.reduce(
          (sum, item) => sum + item.quantityToReturn,
          0,
        );

        return (
          <AccordionItem key={supplierId} value={`supplier-${supplierId}`}>
            <AccordionTrigger>
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-medium">{supplierName}</span>
                <Badge variant="secondary" className="ml-2">
                  {totalToReturn} unidades a devolver
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {items.map((item) => (
                  <div
                    key={`${item.drinkId}-${item.supplierId}`}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.drinkName}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {item.drinkSku}
                        </div>
                      </div>
                      {item.quantityToReturn > 0 && (
                        <Button
                          size="sm"
                          onClick={() => onExecuteReturn(item)}
                          disabled={isExecuting}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Devolver {item.quantityToReturn} unidades
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Recibido</div>
                        <div className="font-medium">{item.totalReceived}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Vendido/Consumido</div>
                        <div className="font-medium">{item.totalConsumed}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Ya Devuelto</div>
                        <div className="font-medium">{item.totalReturned}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Restante</div>
                        <div className="font-medium text-primary">
                          {item.currentStockQuantity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
