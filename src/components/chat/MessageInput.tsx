import React from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ input, setInput, handleSubmit }) => {
  return (
    <div className="bg-white border-t p-4">
      <form onSubmit={handleSubmit} className="flex space-x-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};