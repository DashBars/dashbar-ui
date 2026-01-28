import type { ReactNode } from 'react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
};

type State = {
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container mx-auto p-6 max-w-3xl">
          <Card className="rounded-2xl border-destructive">
            <CardContent className="p-8 space-y-4">
              <h1 className="text-xl font-bold">Se rompió esta pantalla</h1>
              <p className="text-muted-foreground">
                Ocurrió un error al renderizar esta vista.
              </p>
              <pre className="text-xs whitespace-pre-wrap rounded-lg border p-3 bg-muted/50 max-h-[50vh] overflow-auto">
                {this.state.error.message}
                {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
              </pre>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => this.setState({ error: undefined })}>
                  Reintentar
                </Button>
                <Button variant="destructive" onClick={() => window.location.reload()}>
                  Recargar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

