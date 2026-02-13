import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils/cn';
import { Bot, User, Wrench, Loader2 } from 'lucide-react';
import type { Message } from '@/hooks/useAssistant';

interface AssistantMessageProps {
  message: Message;
}

const toolLabels: Record<string, string> = {
  list_events: 'Listando eventos',
  get_event_details: 'Obteniendo detalles del evento',
  get_bar_stock: 'Consultando stock de la barra',
  get_global_inventory: 'Consultando inventario global',
  get_event_recipes: 'Consultando recetas',
  get_event_products: 'Consultando productos',
  get_sales_summary: 'Generando resumen de ventas',
  get_top_products: 'Consultando productos más vendidos',
  get_event_report: 'Consultando reporte del evento',
  get_stock_movements: 'Consultando movimientos de stock',
  get_suppliers: 'Listando proveedores',
  search_drinks: 'Buscando insumos',
  get_pos_sessions: 'Consultando sesiones POS',
  run_custom_query: 'Ejecutando consulta personalizada',
};

export function AssistantMessageComponent({ message }: AssistantMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 py-3 px-2',
        isUser ? 'flex-row-reverse' : '',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 min-w-0 max-w-[85%]',
          isUser ? 'text-right' : '',
        )}
      >
        {/* Tool usage indicators */}
        {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.toolsUsed.map((tool, i) => (
              <span
                key={`${tool}-${i}`}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5"
              >
                <Wrench className="h-3 w-3" />
                {toolLabels[tool] || tool}
              </span>
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 inline-block text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-md'
              : 'bg-muted rounded-tl-md',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.isStreaming && !message.content ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Pensando...</span>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
