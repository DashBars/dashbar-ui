import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  LogOut,
  Search,
  Loader2,
  RefreshCw,
  Receipt,
  X,
  AlertCircle,
  Calendar,
  Store,
  Snowflake,
  GlassWater,
  Info,
  Beaker,
} from 'lucide-react';
import { posDeviceApi } from '@/lib/api/dashbar';
import type { POSProduct, CartItem, POSPaymentMethod, POSSale } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

export function POSKioskPage() {
  const { posnetId } = useParams<{ posnetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<POSPaymentMethod>('cash');
  const [lastSale, setLastSale] = useState<POSSale | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<POSProduct | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);

  // Fetch POS config
  const {
    data: config,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pos-config', posnetId],
    queryFn: () => posDeviceApi.getConfig(Number(posnetId)),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: (data: {
      items: Array<{ cocktailId: number; quantity: number }>;
      paymentMethod: POSPaymentMethod;
      idempotencyKey: string;
    }) =>
      posDeviceApi.createSale(Number(posnetId), {
        items: data.items,
        paymentMethod: data.paymentMethod,
        idempotencyKey: data.idempotencyKey,
      }),
    onSuccess: (sale) => {
      setLastSale(sale);
      setCart([]);
      setCheckoutOpen(false);
      setReceiptOpen(true);
      toast.success('¡Venta completada!');
      queryClient.invalidateQueries({ queryKey: ['pos-config', posnetId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al procesar la venta');
    },
  });

  // Heartbeat effect - only send when config and session are loaded
  useEffect(() => {
    if (!config?.session?.id) return; // Don't send heartbeat until session is loaded

    const interval = setInterval(() => {
      posDeviceApi.heartbeat(Number(posnetId), config.session.id).catch(() => {
        // Silently fail heartbeat
      });
    }, 30000);

    // Send initial heartbeat immediately
    posDeviceApi.heartbeat(Number(posnetId), config.session.id).catch(() => {});

    return () => clearInterval(interval);
  }, [posnetId, config?.session?.id]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_id');
    localStorage.removeItem('pos_name');
    navigate('/pos/login');
  };

  // View product details
  const viewProductDetails = useCallback((product: POSProduct) => {
    setSelectedProduct(product);
    setProductDetailOpen(true);
  }, []);

  // Cart operations
  const addToCart = useCallback((product: POSProduct) => {
    if (!product.available) {
      toast.error(`"${product.name}" no tiene stock disponible`, {
        description: 'No se puede agregar al carrito porque no hay suficiente inventario.',
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        // Check stock limit if available
        if (product.stockLevel !== undefined && existing.quantity >= product.stockLevel) {
          toast.error(`Stock insuficiente para "${product.name}"`, {
            description: `Solo quedan ${product.stockLevel} unidades disponibles.`,
          });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            // Check stock limit
            if (
              delta > 0 &&
              item.product.stockLevel !== undefined &&
              newQty > item.product.stockLevel
            ) {
              toast.error(`Stock insuficiente para "${item.product.name}"`, {
                description: `Solo quedan ${item.product.stockLevel} unidades disponibles.`,
              });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calculate totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const itemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!config?.products) return [];
    return config.products.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [config?.products, searchQuery, selectedCategory]);

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Validate all items have a cocktailId
    const invalidItems = cart.filter((item) => !item.product.cocktailId);
    if (invalidItems.length > 0) {
      toast.error(
        `Los siguientes productos no tienen un cocktail asignado: ${invalidItems.map((i) => i.product.name).join(', ')}`
      );
      return;
    }

    createSaleMutation.mutate({
      items: cart.map((item) => ({
        cocktailId: item.product.cocktailId!,
        quantity: item.quantity,
      })),
      paymentMethod: selectedPaymentMethod,
      idempotencyKey: `${posnetId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
  };

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando terminal POS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error de Conexión</h2>
            <p className="text-muted-foreground mb-4">
              No se pudo conectar al terminal POS. Verifica tu conexión o intenta iniciar sesión nuevamente.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main content - Products */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold">{config?.posnet.name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {config?.event?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" />
                    {config?.bar?.name}
                  </span>
                </div>
              </div>
              <Badge
                variant={config?.posnet?.status === 'OPEN' ? 'default' : 'destructive'}
                className="uppercase"
              >
                {config?.posnet?.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Search and Categories */}
        <div className="p-4 bg-muted/30 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {config?.categories && config.categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="whitespace-nowrap"
              >
                Todos
              </Button>
              {config.categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all relative',
                  product.available
                    ? 'bg-card hover:border-primary hover:shadow-md'
                    : 'bg-muted/50 opacity-50'
                )}
              >
                {/* Info button */}
                {product.components && product.components.length > 0 && (
                  <button
                    onClick={() => viewProductDetails(product)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors z-10"
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                
                <button
                  onClick={() => addToCart(product)}
                  disabled={!product.available}
                  className={cn(
                    'w-full text-left',
                    !product.available && 'cursor-not-allowed'
                  )}
                >
                  <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center text-4xl">
                    🍹
                  </div>
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <p className="text-primary font-bold mt-1">
                    {formatCurrency(product.price)}
                  </p>
                  
                  {/* Recipe summary */}
                  {product.glassVolume && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <GlassWater className="h-3 w-3" />
                        {product.glassVolume}ml
                      </span>
                      {product.hasIce && (
                        <span className="flex items-center gap-0.5">
                          <Snowflake className="h-3 w-3" />
                          Hielo
                        </span>
                      )}
                    </div>
                  )}
                  
                  {product.stockLevel !== undefined && product.stockLevel === 0 && (
                    <Badge variant="destructive" className="mt-1 text-xs">
                      Sin stock
                    </Badge>
                  )}
                  {product.stockLevel !== undefined && product.stockLevel > 0 && product.stockLevel <= 5 && (
                    <Badge variant="outline" className="mt-1 text-xs text-amber-600 border-amber-300">
                      {product.stockLevel} restantes
                    </Badge>
                  )}
                </button>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-80 lg:w-96 bg-card border-l flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="font-semibold">Carrito</h2>
              {itemCount > 0 && (
                <Badge variant="secondary">{itemCount}</Badge>
              )}
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground">El carrito está vacío</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-muted/50 rounded-lg p-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-sm">
                      {item.product.name}
                    </h4>
                    <p className="text-primary text-sm">
                      {formatCurrency(item.product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total</span>
            <span className="text-2xl font-bold">
              {formatCurrency(cartTotal)}
            </span>
          </div>
          <Button
            className="w-full h-14 text-lg font-semibold"
            disabled={cart.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Pagar
          </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar</DialogTitle>
            <DialogDescription>
              Selecciona el método de pago para completar la venta
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Total a pagar</p>
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(cartTotal)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedPaymentMethod('cash')}
              >
                <Banknote className="h-6 w-6" />
                <span>Efectivo</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === 'credit' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedPaymentMethod('credit')}
              >
                <CreditCard className="h-6 w-6" />
                <span>Tarjeta</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === 'wallet' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedPaymentMethod('wallet')}
              >
                <Smartphone className="h-6 w-6" />
                <span>Digital</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={createSaleMutation.isPending}
            >
              {createSaleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Confirmar Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Venta Completada
            </DialogTitle>
          </DialogHeader>

          {lastSale && (
            <div className="py-4 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Venta #</span>
                  <span className="font-mono">{lastSale.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Artículos</span>
                  <span>{lastSale.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="border-t my-2" />
                {lastSale.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span>{item.quantity}x {item.productName}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatCurrency(item.unitPrice)} c/u)
                        </span>
                      )}
                    </div>
                    <span>{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
                <div className="border-t my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(lastSale.total)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.open(
                      `/pos/${posnetId}/receipt/${lastSale.id}`,
                      '_blank'
                    );
                  }}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Imprimir Recibo
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setReceiptOpen(false)} className="w-full">
              Nueva Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={productDetailOpen} onOpenChange={setProductDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Receta y composición del trago
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="py-4 space-y-4">
              {/* Price and basic info */}
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(selectedProduct.price)}
                </span>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {selectedProduct.glassVolume && (
                    <span className="flex items-center gap-1">
                      <GlassWater className="h-4 w-4" />
                      {selectedProduct.glassVolume}ml
                    </span>
                  )}
                  {selectedProduct.hasIce && (
                    <span className="flex items-center gap-1 text-blue-500">
                      <Snowflake className="h-4 w-4" />
                      Con hielo
                    </span>
                  )}
                </div>
              </div>

              {/* Ice info */}
              {selectedProduct.hasIce && selectedProduct.glassVolume && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3">
                  <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <Snowflake className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>
                      El hielo ocupa aprox. <span className="font-semibold">
                        {(() => {
                          const glass = selectedProduct.glassVolume!;
                          const iceVol = glass <= 250 ? Math.round(glass * 0.3) : glass <= 350 ? Math.round(glass * 0.33) : Math.round(glass * 0.4);
                          return `${iceVol}ml`;
                        })()}
                      </span>, dejando <span className="font-semibold">
                        {(() => {
                          const glass = selectedProduct.glassVolume!;
                          const iceVol = glass <= 250 ? Math.round(glass * 0.3) : glass <= 350 ? Math.round(glass * 0.33) : Math.round(glass * 0.4);
                          return `${glass - iceVol}ml`;
                        })()}
                      </span> para líquido
                    </span>
                  </div>
                </div>
              )}

              {/* Components */}
              {selectedProduct.components && selectedProduct.components.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Composición
                  </h4>
                  <div className="space-y-2">
                    {selectedProduct.components.map((component) => {
                      // Calculate liquid volume considering ice
                      let liquidVolume = selectedProduct.glassVolume || 0;
                      if (selectedProduct.hasIce && selectedProduct.glassVolume) {
                        const glass = selectedProduct.glassVolume;
                        const iceVol = glass <= 250 ? Math.round(glass * 0.3) : glass <= 350 ? Math.round(glass * 0.33) : Math.round(glass * 0.4);
                        liquidVolume = glass - iceVol;
                      }
                      const mlAmount = Math.round((liquidVolume * component.percentage) / 100);
                      
                      return (
                        <div
                          key={component.drinkId}
                          className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                        >
                          <div>
                            <p className="font-medium">{component.drinkName}</p>
                            <p className="text-xs text-muted-foreground">
                              {component.drinkBrand}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${component.percentage}%` }}
                                />
                              </div>
                              <span className="font-bold text-sm w-10 text-right">
                                {component.percentage}%
                              </span>
                            </div>
                            {selectedProduct.glassVolume && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                {mlAmount}ml
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProductDetailOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                if (selectedProduct) {
                  addToCart(selectedProduct);
                  setProductDetailOpen(false);
                }
              }}
              disabled={!selectedProduct?.available}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar al carrito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
