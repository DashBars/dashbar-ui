import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function NotFoundPage() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card className="rounded-2xl">
        <CardContent className="p-10 text-center space-y-4">
          <h1 className="text-2xl font-bold">Página no encontrada</h1>
          <p className="text-muted-foreground">
            La ruta que intentaste abrir no existe o cambió.
          </p>
          <div>
            <Button asChild>
              <Link to="/events">Volver a Eventos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

