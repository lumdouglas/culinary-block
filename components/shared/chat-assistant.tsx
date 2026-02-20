"use client"

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

// Manually define the interface to bypass the library export issue
interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'data' | 'tool';
  content: string;
}

export function ChatAssistant() {
  const [isOpen] = useState(false);

  // Cast useChat to any temporarily if the destructuring is still red
  const { messages } = useChat() as unknown as { messages: ChatMessage[] };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* ... toggle logic ... */}
      {isOpen && (
        <div className="bg-white border rounded-lg shadow-2xl w-80 h-[450px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((m: ChatMessage) => (
              <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <span className={`inline-block p-2 rounded-lg ${m.role === 'user' ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                  {m.content}
                </span>
              </div>
            ))}
          </div>
          {/* ... form logic ... */}
        </div>
      )}
    </div>
  );
}