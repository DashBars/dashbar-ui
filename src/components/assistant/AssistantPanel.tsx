import { useState, useRef, useEffect } from 'react';
import { X, Send, Maximize2, StopCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { AssistantMessageComponent } from './AssistantMessage';
import type { Message } from '@/hooks/useAssistant';

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
  onExpand: () => void;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onNewConversation: () => void;
  onAbort: () => void;
}

export function AssistantPanel({
  open,
  onClose,
  onExpand,
  messages,
  isLoading,
  error,
  onSendMessage,
  onNewConversation,
  onAbort,
}: AssistantPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full z-50 bg-background border-l shadow-2xl flex flex-col transition-transform duration-300 ease-in-out',
          'w-full sm:w-[420px]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Dashbar AI</h3>
              <p className="text-[10px] text-muted-foreground">
                Asistente inteligente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onNewConversation}
              title="Nueva conversación"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onExpand}
              title="Abrir en página completa"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-2xl">💬</span>
              </div>
              <h4 className="font-semibold text-sm mb-1">
                ¡Hola! Soy tu asistente Dashbar
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Preguntame sobre tus eventos, stock, ventas, recetas y más.
              </p>
              <div className="space-y-2 w-full">
                {[
                  '¿Cuánto stock queda en mis barras?',
                  '¿Cuáles fueron los productos más vendidos?',
                  '¿Cuál fue mi ingreso total del último evento?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => onSendMessage(q)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <AssistantMessageComponent key={idx} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-t">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-3 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu pregunta..."
              rows={1}
              className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[38px] max-h-[120px]"
              style={{ height: 'auto', overflow: 'auto' }}
              disabled={isLoading}
            />
            {isLoading ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-[38px] w-[38px] p-0 rounded-xl shrink-0"
                onClick={onAbort}
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                className="h-[38px] w-[38px] p-0 rounded-xl shrink-0"
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
