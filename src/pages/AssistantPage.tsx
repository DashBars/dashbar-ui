import { useState, useRef, useEffect } from 'react';
import {
  Send,
  StopCircle,
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  Bot,
  BotOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { AssistantMessageComponent } from '@/components/assistant/AssistantMessage';
import { useAssistant } from '@/hooks/useAssistant';

export function AssistantPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const assistant = useAssistant();

  // Disabled state
  if (assistant.isDisabled) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center max-w-sm px-6">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <BotOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Asistente desactivado</h3>
          <p className="text-sm text-muted-foreground">
            El asistente IA está desactivado en este momento. Se habilitará próximamente.
          </p>
        </div>
      </div>
    );
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistant.messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [assistant.conversationId]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || assistant.isLoading) return;
    assistant.sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Conversations sidebar */}
      <aside className="hidden md:flex md:flex-col w-72 border-r bg-muted/30 shrink-0">
        {/* Sidebar header */}
        <div className="p-3 border-b">
          <Button
            onClick={assistant.newConversation}
            className="w-full justify-start gap-2"
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Nueva conversación
          </Button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {assistant.isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : assistant.conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                No hay conversaciones previas
              </p>
            </div>
          ) : (
            assistant.conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
                  conv.id === assistant.conversationId
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-muted-foreground',
                )}
                onClick={() => assistant.loadConversation(conv.id)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-xs">
                  {conv.title || 'Sin título'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    assistant.deleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Dashbar AI</h2>
              <p className="text-[10px] text-muted-foreground">
                Asistente inteligente para gestión de eventos
              </p>
            </div>
          </div>
          <Button
            onClick={assistant.newConversation}
            variant="outline"
            size="sm"
            className="gap-1.5 md:hidden"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16">
          {assistant.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                ¡Hola! Soy tu asistente Dashbar
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Puedo ayudarte a consultar información sobre tus eventos,
                barras, stock, ventas, recetas y más. Preguntame lo que
                necesites.
              </p>
              <div className="grid gap-2 w-full sm:grid-cols-2">
                {[
                  '¿Cuánto stock queda en mis barras?',
                  '¿Cuáles fueron los productos más vendidos?',
                  '¿Cuál fue mi ingreso total?',
                  '¿Cuántas ventas tuvo cada terminal POS?',
                  '¿Qué recetas tengo configuradas?',
                  '¿Cuáles son mis proveedores?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => assistant.sendMessage(q)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {assistant.messages.map((msg, idx) => (
                <AssistantMessageComponent key={idx} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {assistant.error && (
          <div className="px-6 py-2 bg-destructive/10 border-t">
            <p className="text-xs text-destructive">{assistant.error}</p>
          </div>
        )}

        {/* Input area */}
        <div className="border-t px-4 md:px-8 lg:px-16 py-4 shrink-0">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu pregunta..."
              rows={1}
              className="flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[42px] max-h-[160px]"
              style={{ height: 'auto', overflow: 'auto' }}
              disabled={assistant.isLoading}
            />
            {assistant.isLoading ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-[42px] w-[42px] p-0 rounded-xl shrink-0"
                onClick={assistant.abort}
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                className="h-[42px] w-[42px] p-0 rounded-xl shrink-0"
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
          <p className="text-center text-[10px] text-muted-foreground mt-2 max-w-3xl mx-auto">
            Dashbar AI puede cometer errores. Verificá la información
            importante.
          </p>
        </div>
      </div>
    </div>
  );
}
