import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Monitor } from 'lucide-react';
import { posDeviceApi } from '@/lib/api/dashbar';

export function POSLoginPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await posDeviceApi.login(code.toUpperCase());
      // Store POS token
      localStorage.setItem('pos_token', response.accessToken);
      localStorage.setItem('pos_id', String(response.posnet.id));
      localStorage.setItem('pos_name', response.posnet.name);
      // Navigate to kiosk
      navigate(`/pos/${response.posnet.id}/kiosk`);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Invalid POS code. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle numeric keypad input
  const handleKeyPress = (key: string) => {
    if (key === 'clear') {
      setCode('');
    } else if (key === 'back') {
      setCode((prev) => prev.slice(0, -1));
    } else if (code.length < 12) {
      setCode((prev) => prev + key);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Monitor className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Terminal POS</CardTitle>
          <CardDescription>
            Ingresa el código del terminal para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">
                Código del Terminal
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="POS-XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-2xl font-mono tracking-[0.2em] h-16"
                required
                autoFocus
                disabled={isSubmitting}
                maxLength={12}
              />
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map(
                (key) => (
                  <Button
                    key={key}
                    type="button"
                    variant={key === 'clear' || key === 'back' ? 'outline' : 'secondary'}
                    className="h-14 text-xl font-semibold"
                    onClick={() => handleKeyPress(key)}
                    disabled={isSubmitting}
                  >
                    {key === 'clear' ? 'C' : key === 'back' ? '←' : key}
                  </Button>
                )
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold"
              disabled={isSubmitting || code.length < 6}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar Terminal'
              )}
            </Button>
          </form>

          <div className="mt-6 text-xs text-muted-foreground text-center">
            <p>Contacta a tu manager si no tienes un código de terminal.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
