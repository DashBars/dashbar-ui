import { useState } from 'react';
import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Bar } from '@/lib/api/types';
import { useBar } from '@/hooks/useBars';
import { StockTab } from './StockTab';
import { RecipeOverridesTab } from './RecipeOverridesTab';
import { PosnetsTab } from './PosnetsTab';
import { Skeleton } from '@/components/ui/skeleton';

interface BarDetailsSheetProps {
  eventId: number;
  bar: Bar;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'overview' | 'stock' | 'recipes' | 'pos';
}

export function BarDetailsSheet({
  eventId,
  bar,
  open,
  onOpenChange,
  initialTab = 'overview',
}: BarDetailsSheetProps) {
  const { data: barData, isLoading } = useBar(eventId, bar.id);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Reset tab when sheet opens with a new initial tab
  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const displayBar = barData || bar;

  const barTypeColors: Record<string, 'default' | 'secondary' | 'outline'> = {
    VIP: 'default',
    general: 'secondary',
    backstage: 'outline',
    lounge: 'secondary',
  };

  const statusColors: Record<
    string,
    'default' | 'secondary' | 'destructive'
  > = {
    open: 'default',
    closed: 'secondary',
    lowStock: 'destructive',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl">{displayBar.name}</SheetTitle>
            <div className="flex gap-2">
              <Badge variant={barTypeColors[displayBar.type] || 'default'}>
                {displayBar.type}
              </Badge>
              <Badge variant={statusColors[displayBar.status] || 'default'}>
                {displayBar.status}
              </Badge>
            </div>
          </div>
          <SheetDescription>
            Manage bar configuration, stock, recipes, and POS devices.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stock">Stock</TabsTrigger>
              <TabsTrigger value="recipes">Recipes</TabsTrigger>
              <TabsTrigger value="pos">POS</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Bar Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{displayBar.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant={barTypeColors[displayBar.type] || 'default'}>
                        {displayBar.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={statusColors[displayBar.status] || 'default'}>
                        {displayBar.status}
                      </Badge>
                    </div>
                    {displayBar.posnets && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">POS Devices:</span>
                        <span className="font-medium">
                          {displayBar.posnets.length}
                        </span>
                      </div>
                    )}
                    {displayBar.stocks && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stock Items:</span>
                        <span className="font-medium">
                          {displayBar.stocks.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="stock" className="mt-4">
              <StockTab eventId={eventId} barId={displayBar.id} />
            </TabsContent>
            <TabsContent value="recipes" className="mt-4">
              <RecipeOverridesTab eventId={eventId} barId={displayBar.id} />
            </TabsContent>
            <TabsContent value="pos" className="mt-4">
              <PosnetsTab posnets={displayBar.posnets || []} />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
