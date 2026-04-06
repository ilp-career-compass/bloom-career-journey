import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { aiChatService } from '@/services/aiChatService';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

type ChatbotDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ChatbotDialog({ open, onOpenChange }: ChatbotDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => !!input.trim() && !loading, [input, loading]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  const handleSend = async () => {
    if (!canSend) return;
    const content = input.trim();
    setInput('');

    // Optimistic UI update
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', text: content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    scrollToBottom();

    setLoading(true);
    try {
      // Call shared service
      const response = await aiChatService.sendMessage(messages, content);

      if (response.success && response.text) {
        const modelMessage: Message = { id: crypto.randomUUID(), role: 'model', text: response.text };
        setMessages(prev => [...prev, modelMessage]);
      } else {
        throw new Error(response.error || 'Unknown error');
      }

      scrollToBottom();
    } catch (err: any) {
      const fail: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: `I'm having trouble connecting right now. (${err.message}). Please try again later.`
      };
      setMessages(prev => [...prev, fail]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Chatbot</DialogTitle>
          <DialogDescription>Ask questions about ILP counselling. Answers are AI-generated based on your configured sources.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div ref={listRef} className="h-72 overflow-y-auto rounded-md border p-3 bg-white">
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500">Start by asking a question. Example: "Give me guidance for running a counselling session with grade 9 students."</div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`mb-2 ${m.role === 'user' ? 'text-gray-900' : 'text-gray-700'}`}>
                  <div className="text-xs text-gray-500 mb-1">{m.role === 'user' ? 'You' : 'Assistant'}</div>
                  <div className="whitespace-pre-wrap break-words bg-gray-50 p-2 rounded">{m.text}</div>
                </div>
              ))
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="chat-input">Your question</Label>
            <Textarea id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question" rows={3} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMessages([])} disabled={loading}>Clear</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSend} disabled={!canSend}>{loading ? 'Sending…' : 'Send'}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


