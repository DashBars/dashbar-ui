import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashbar';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type {
  DashboardTotals,
  TopProduct,
  WsSaleCreatedPayload,
  WsPosStateUpdatePayload,
  WsPosMetricsUpdatePayload,
  WsPosSalePayload,
  WsAlertPayload,
  PosnetStatus,
} from '@/lib/api/types';

// ── Types for the hook's state ──

export interface RecentSale {
  id: number;
  cocktailName: string;
  quantity: number;
  totalAmount: number;
  barId: number;
  barName?: string;
  isDirectSale?: boolean;
  createdAt: string;
}

export interface PosLiveMetrics {
  posnetId: number;
  status: PosnetStatus;
  traffic: number;
}

export interface LiveAlert {
  id: number;
  eventId: number;
  barId: number;
  drinkName: string;
  barName: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface EventDashboardState {
  // KPI totals (REST initial + WS incremental)
  totals: DashboardTotals | null;
  topProducts: TopProduct[];
  // Real-time feed
  recentSales: RecentSale[];
  // POS live metrics
  posMetrics: Map<number, PosLiveMetrics>;
  // Alerts
  alerts: LiveAlert[];
  // Connection status
  connected: boolean;
  isLoading: boolean;
}

const MAX_RECENT_SALES = 25;
const MAX_ALERTS = 15;
const REFETCH_INTERVAL = 5_000; // 5s fallback re-fetch

export function useEventDashboard(eventId: number) {
  const queryClient = useQueryClient();

  // ── REST initial data ──
  const {
    data: initialTotals,
    isLoading: isLoadingTotals,
  } = useQuery({
    queryKey: ['dashboard', 'totals', eventId],
    queryFn: () => dashboardApi.getTotals(eventId),
    enabled: !!eventId,
    refetchInterval: REFETCH_INTERVAL,
  });

  const {
    data: initialTopProducts,
    isLoading: isLoadingTopProducts,
  } = useQuery({
    queryKey: ['dashboard', 'top-products', eventId],
    queryFn: () => dashboardApi.getTopProducts(eventId, 5),
    enabled: !!eventId,
    refetchInterval: REFETCH_INTERVAL,
  });

  // ── Local real-time state ──
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [posMetrics, setPosMetrics] = useState<Map<number, PosLiveMetrics>>(new Map());
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [connected, setConnected] = useState(false);

  // Running totals that layer on top of the REST snapshot
  const [incrementalTotals, setIncrementalTotals] = useState({
    amount: 0,
    units: 0,
    orders: 0,
    consumptionMl: 0,
  });

  // Track bar name mapping for display
  const barNamesRef = useRef<Map<number, string>>(new Map());

  // ── Combined totals ──
  const totals: DashboardTotals | null = initialTotals
    ? {
        sales: {
          totalAmount: initialTotals.sales.totalAmount + incrementalTotals.amount,
          totalUnits: initialTotals.sales.totalUnits + incrementalTotals.units,
          orderCount: initialTotals.sales.orderCount + incrementalTotals.orders,
        },
        consumption: {
          totalMl: initialTotals.consumption.totalMl + incrementalTotals.consumptionMl,
          byDrink: initialTotals.consumption.byDrink,
        },
      }
    : null;

  // Reset incremental totals when REST data refreshes
  useEffect(() => {
    setIncrementalTotals({ amount: 0, units: 0, orders: 0, consumptionMl: 0 });
  }, [initialTotals]);

  // ── Update bar names from external data ──
  const updateBarNames = useCallback((bars: Array<{ id: number; name: string }>) => {
    const map = new Map<number, string>();
    bars.forEach((b) => map.set(b.id, b.name));
    barNamesRef.current = map;
  }, []);

  // ── WebSocket connection ──
  useEffect(() => {
    if (!eventId) return;

    let socket: ReturnType<typeof getSocket>;

    try {
      socket = getSocket();
    } catch {
      console.warn('[useEventDashboard] Could not create socket (no auth token?)');
      return;
    }

    // Subscribe to the event room
    socket.emit('subscribe:event', { eventId });

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    // ── sale:created (legacy sales + stock depletion) ──
    const handleSaleCreated = (payload: WsSaleCreatedPayload) => {
      const sale: RecentSale = {
        id: payload.data.saleId,
        cocktailName: payload.data.cocktailName,
        quantity: payload.data.quantity,
        totalAmount: payload.data.totalAmount,
        barId: payload.barId,
        barName: barNamesRef.current.get(payload.barId),
        isDirectSale: payload.data.isDirectSale ?? false,
        createdAt: payload.data.createdAt as string,
      };

      setRecentSales((prev) => [sale, ...prev].slice(0, MAX_RECENT_SALES));

      setIncrementalTotals((prev) => ({
        amount: prev.amount + payload.data.totalAmount,
        units: prev.units + payload.data.quantity,
        orders: prev.orders + 1,
        consumptionMl: prev.consumptionMl,
      }));
    };

    // ── pos:sale_completed (POS sales) ──
    const handlePosSaleCompleted = (payload: WsPosSalePayload) => {
      const sale: RecentSale = {
        id: payload.sale.id,
        cocktailName: payload.sale.productName || 'Venta POS',
        quantity: payload.sale.itemCount,
        totalAmount: payload.sale.total,
        barId: payload.barId,
        barName: barNamesRef.current.get(payload.barId),
        createdAt: new Date().toISOString(),
      };

      setRecentSales((prev) => [sale, ...prev].slice(0, MAX_RECENT_SALES));

      // Also invalidate queries so REST data updates
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'totals', eventId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'top-products', eventId] });
    };

    // ── pos:state_update ──
    const handlePosStateUpdate = (payload: WsPosStateUpdatePayload) => {
      setPosMetrics((prev) => {
        const next = new Map(prev);
        const existing = next.get(payload.posnetId);
        next.set(payload.posnetId, {
          posnetId: payload.posnetId,
          status: payload.state,
          traffic: existing?.traffic ?? 0,
        });
        return next;
      });
    };

    // ── pos:metrics_update ──
    const handlePosMetricsUpdate = (payload: WsPosMetricsUpdatePayload) => {
      setPosMetrics((prev) => {
        const next = new Map(prev);
        next.set(payload.posnetId, {
          posnetId: payload.posnetId,
          status: payload.metrics.status,
          traffic: payload.metrics.traffic,
        });
        return next;
      });
    };

    // ── alert:created ──
    const handleAlertCreated = (payload: WsAlertPayload) => {
      const alert: LiveAlert = {
        id: payload.id,
        eventId: payload.eventId,
        barId: payload.barId,
        drinkName: payload.drinkName || 'Insumo',
        barName: payload.barName || barNamesRef.current.get(payload.barId) || 'Barra',
        type: payload.type,
        message: payload.message,
        createdAt: payload.createdAt,
      };

      setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('sale:created', handleSaleCreated);
    socket.on('pos:sale_completed', handlePosSaleCompleted);
    socket.on('pos:state_update', handlePosStateUpdate);
    socket.on('pos:metrics_update', handlePosMetricsUpdate);
    socket.on('alert:created', handleAlertCreated);

    if (socket.connected) setConnected(true);

    return () => {
      socket.emit('unsubscribe:event', { eventId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('sale:created', handleSaleCreated);
      socket.off('pos:sale_completed', handlePosSaleCompleted);
      socket.off('pos:state_update', handlePosStateUpdate);
      socket.off('pos:metrics_update', handlePosMetricsUpdate);
      socket.off('alert:created', handleAlertCreated);
      disconnectSocket();
    };
  }, [eventId, queryClient]);

  return {
    totals,
    topProducts: initialTopProducts?.products ?? [],
    recentSales,
    posMetrics,
    alerts,
    connected,
    isLoading: isLoadingTotals || isLoadingTopProducts,
    updateBarNames,
  };
}
