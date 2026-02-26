import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Types ────────────────────────────────────────────────────────

export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  isStreaming?: boolean;
  toolsUsed?: string[];
}

export interface Conversation {
  id: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: { content: string; role: string }[];
}

// ── API functions ────────────────────────────────────────────────

async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await axios.get(`${API_BASE_URL}/assistant/conversations`, {
    headers: getAuthHeaders(),
  });
  return data;
}

async function fetchConversation(id: number) {
  const { data } = await axios.get(`${API_BASE_URL}/assistant/conversations/${id}`, {
    headers: getAuthHeaders(),
  });
  return data;
}

async function deleteConversationApi(id: number) {
  await axios.delete(`${API_BASE_URL}/assistant/conversations/${id}`, {
    headers: getAuthHeaders(),
  });
}

async function fetchStatus(): Promise<{ enabled: boolean }> {
  const { data } = await axios.get(`${API_BASE_URL}/assistant/status`, {
    headers: getAuthHeaders(),
  });
  return data;
}

// ── Hook ─────────────────────────────────────────────────────────

export function useAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Check if assistant is enabled – silent on error (assume disabled)
  const statusQuery = useQuery({
    queryKey: ['assistant-status'],
    queryFn: fetchStatus,
    staleTime: 5 * 60 * 1000, // Cache for 5 min
    retry: false,
    meta: { silent: true },
  });

  const isDisabled = statusQuery.isError || statusQuery.data?.enabled === false;

  // Fetch conversation list
  const conversationsQuery = useQuery({
    queryKey: ['assistant-conversations'],
    queryFn: fetchConversations,
    enabled: !isDisabled,
  });

  // Load a specific conversation
  const loadConversation = useCallback(async (id: number) => {
    try {
      const data = await fetchConversation(id);
      setConversationId(id);
      setMessages(
        (data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      );
      setError(null);
    } catch (err: any) {
      setError('Error al cargar la conversación');
    }
  }, []);

  // Start a new conversation
  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(
    async (id: number) => {
      try {
        await deleteConversationApi(id);
        queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
        if (conversationId === id) {
          newConversation();
        }
      } catch (err: any) {
        setError('Error al eliminar la conversación');
      }
    },
    [conversationId, newConversation, queryClient],
  );

  // Send a message (SSE streaming)
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);

      // Add user message immediately
      const userMsg: Message = { role: 'user', content: content.trim() };
      setMessages((prev) => [...prev, userMsg]);

      // Add placeholder assistant message
      const assistantMsg: Message = {
        role: 'assistant',
        content: '',
        isStreaming: true,
        toolsUsed: [],
      };
      setMessages((prev) => [...prev, assistantMsg]);

      setIsLoading(true);

      try {
        // Use fetch for SSE (axios doesn't support streaming well)
        const controller = new AbortController();
        abortRef.current = controller;

        const headers = new Headers({ 'Content-Type': 'application/json' });
        const authHeaders = getAuthHeaders();
        if (authHeaders.Authorization) {
          headers.set('Authorization', authHeaders.Authorization);
        }

        const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: content.trim(),
            conversationId: conversationId || undefined,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));

                if (event.type === 'conversation_id') {
                  setConversationId(event.data.conversationId);
                } else if (event.type === 'text_delta') {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        content: last.content + event.data.text,
                      };
                    }
                    return updated;
                  });
                } else if (event.type === 'tool_use') {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        toolsUsed: [...(last.toolsUsed || []), event.data.tool],
                      };
                    }
                    return updated;
                  });
                } else if (event.type === 'error') {
                  setError(event.data.message);
                } else if (event.type === 'done') {
                  // Mark streaming as complete
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        isStreaming: false,
                      };
                    }
                    return updated;
                  });
                }
              } catch {
                // Invalid JSON, skip
              }
            }
          }
        }

        // Defensive close: if the stream finishes without explicit "done",
        // ensure the assistant bubble is no longer marked as streaming.
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant' && last.isStreaming) {
            updated[updated.length - 1] = {
              ...last,
              isStreaming: false,
            };
          }
          return updated;
        });

        // Refresh conversations list
        queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Error al enviar el mensaje');
          // Remove the empty assistant message on error
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant' && !last.content) {
              return updated.slice(0, -1);
            }
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [conversationId, isLoading, queryClient],
  );

  // Abort current request
  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    conversationId,
    isLoading,
    error,
    isDisabled,
    sendMessage,
    loadConversation,
    newConversation,
    deleteConversation,
    abort,
    conversations: conversationsQuery.data || [],
    isLoadingConversations: conversationsQuery.isLoading,
  };
}
