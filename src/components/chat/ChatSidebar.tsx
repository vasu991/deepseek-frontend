import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, LogOut, Clock } from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';
import { Session } from '../../types/chat';

interface ChatSidebarProps {
  sessions: Session[];
  sessionId?: string;
  isLoading: boolean;
  isFetching: boolean;
  handleNewChat: () => void;
  logout: () => void;
  formatSessionTitle: (session: Session) => string;
  formatDate: (isoString: string) => string;
  animatedSessions: string[]; // New prop to track which sessions should animate
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  sessionId,
  isLoading,
  isFetching,
  handleNewChat,
  logout,
  formatSessionTitle,
  formatDate,
  animatedSessions, // Destructure the new prop
}) => {
  const [animatedSessionNames, setAnimatedSessionNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setAnimatedSessionNames((prevNames) => {
      const updatedNames = { ...prevNames };
      sessions.forEach((session) => {
        const newTitle = formatSessionTitle(session).split('-')[0];
        if (prevNames[session.sessionId] !== newTitle) {
          updatedNames[session.sessionId] = newTitle;
        }
      });
      return updatedNames;
    });
  }, [sessions, formatSessionTitle]);

  return (
    <div className="w-64 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Chat Sessions</h2>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-700"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={handleNewChat}
          disabled={isLoading}
          className={`w-full flex items-center p-2 mb-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          {isLoading ? 'Creating...' : 'New Chat'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isFetching ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <Clock className="h-5 w-5 animate-spin mr-2" />
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No chat sessions yet</div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <Link
                key={session.sessionId}
                to={`/chat/${session.sessionId}`}
                className={`block p-3 rounded-lg transition-colors ${
                  sessionId === session.sessionId ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-start">
                  <MessageSquare className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {animatedSessions.includes(session.sessionId) ? (
                        <TypeAnimation
                          key={session.sessionId + animatedSessionNames[session.sessionId]}
                          sequence={[animatedSessionNames[session.sessionId] || '', 1000]}
                          speed={10}
                          wrapper="span"
                          repeat={0}
                          cursor={false}
                        />
                      ) : (
                        animatedSessionNames[session.sessionId] || ''
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.createdAt ? formatDate(session.createdAt) : 'No Date'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};