import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssistantPanel } from './AssistantPanel';
import { useAssistant } from '@/hooks/useAssistant';

export function AssistantBubble() {
  const [panelOpen, setPanelOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const assistant = useAssistant();

  // Don't render the bubble if disabled or already on the assistant page
  if (assistant.isDisabled || location.pathname === '/assistant') return null;

  const handleExpand = () => {
    setPanelOpen(false);
    navigate('/assistant');
  };

  return (
    <>
      {/* Floating bubble button */}
      <Button
        onClick={() => setPanelOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg p-0 hover:scale-105 transition-transform"
        size="sm"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      {/* Sliding panel */}
      <AssistantPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onExpand={handleExpand}
        messages={assistant.messages}
        isLoading={assistant.isLoading}
        error={assistant.error}
        onSendMessage={assistant.sendMessage}
        onNewConversation={assistant.newConversation}
        onAbort={assistant.abort}
      />
    </>
  );
}
