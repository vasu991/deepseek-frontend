import React, { useRef, useEffect } from 'react';
import { Message } from '../../types/chat';
import { Clock } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isFetching: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isFetching }) => {
  // Explicitly type the ref as HTMLDivElement
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {isFetching ? (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <Clock className="h-5 w-5 animate-spin mr-2" />
          Loading messages...
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            key={message.id ?? `message-${index}`}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xl p-4 rounded-lg overflow-hidden ${
                message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'
              }`}
            >
              <p className="break-words">{message.content}</p> {/* Break long words */}
              <span className="text-xs opacity-75 mt-1 block">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
            </div>
          </div>
        ))
      )}
      <div ref={endOfMessagesRef} /> {/* Scroll target */}
    </div>
  );
};
