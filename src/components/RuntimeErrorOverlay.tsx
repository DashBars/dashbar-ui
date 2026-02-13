import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type RuntimeErrorState = {
  message: string;
  stack?: string;
  source?: 'error' | 'unhandledrejection';
};

export function RuntimeErrorOverlay() {
  const [err, setErr] = useState<RuntimeErrorState | null>(null);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      setErr({
        source: 'error',
        message: event.error?.message || event.message || 'Error desconocido',
        stack: event.error?.stack,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason: any = event.reason;
      setErr({
        source: 'unhandledrejection',
        message: reason?.message || String(reason) || 'Error de promesa',
        stack: reason?.stack,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (!err) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto p-6 max-w-3xl">
        <Card className="rounded-2xl border-destructive">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-destructive font-medium">
                Error runtime ({err.source})
              </div>
              <div className="text-lg font-semibold">{err.message}</div>
            </div>

            {err.stack && (
              <pre className="text-xs whitespace-pre-wrap rounded-lg border p-3 bg-muted/50 max-h-[50vh] overflow-auto">
                {err.stack}
              </pre>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setErr(null)} variant="outline">
                Cerrar
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="destructive"
              >
                Recargar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

