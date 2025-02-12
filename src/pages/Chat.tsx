import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, LogOut, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Message, Session } from '../types/chat';
import { createSession, fetchSessions, fetchSessionMessages } from '../services/api';

export function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const sessions = useAuthStore((state) => state.sessions);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  // Fetch all sessions
  useEffect(() => {
    async function loadSessions() {
      if (!token || !user) return;

      try {
        console.log("Fetching chat sessions...");

        // ✅ Load sessions from Zustand first (which loads from localStorage)
        let storedSessions = useAuthStore.getState().sessions;

        if (!storedSessions || storedSessions.length === 0) {
          // If Zustand has no sessions, check localStorage
          storedSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
          if (storedSessions.length > 0) {
            useAuthStore.getState().setSessions(storedSessions);
            console.log("Loaded stored sessions from localStorage:", storedSessions);
          }
        }

        // ✅ Fetch fresh sessions from API only if necessary
        const userSessions = await fetchSessions(token, user);
        if (JSON.stringify(userSessions) !== JSON.stringify(storedSessions)) {
          useAuthStore.getState().setSessions(userSessions);
          console.log("Updated Zustand sessions from API:", userSessions);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setIsFetching(false);
      }
    }

    loadSessions();
  }, [token, user]);



  // Fetch messages for current session
  useEffect(() => {
    async function loadMessages() {
      if (!token || !sessionId) {
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: `Hello ${user?.username}! How can I help you today?`
          },
        ]);
        return;
      }

      try {
        setIsFetching(true);
        const sessionMessages = await fetchSessionMessages(token, sessionId);
        setMessages(sessionMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsFetching(false);
      }
    }
    loadMessages();
  }, [sessionId, token, user?.username]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(); // Adjust format based on locale
  };

  const handleNewChat = async () => {
    if (!token) {
      console.error("Token is missing. User might not be authenticated.");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Creating a new chat session...");

      const session = await createSession(token);

      if (!session || !session.sessionId) {
        throw new Error("Invalid session response from API");
      }

      console.log("New session created:", session);


      useAuthStore.getState().addSession(session); // Store in Zustand
      console.log("Session added to store:", session);

      navigate(`/chat/${session.sessionId}`);
      console.log("Navigating to new chat:", `/chat/${session.sessionId}`);
    } catch (error) {
      console.error("Failed to create new session:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || !token) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      // Send message to backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          prompt: input
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from bot');
      }

      const data = await response.json();

      const botMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response
      };

      // Add bot message to UI
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching bot response:', error);
    }
  };

  const formatSessionTitle = (session: Session) => {
    if (!session) return 'New Chat';
    return `${session.sessionName || 'Untitled Chat'} - ${formatDate(session.createdAt)}`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Chat Sessions</h2>
            <button
              onClick={() => logout()}
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
            <div className="p-4 text-center text-gray-500">
              No chat sessions yet
            </div>
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
                      <p className="text-sm font-medium truncate">{formatSessionTitle(session).split('-')[0]}</p>
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white p-4 shadow">
          <h1 className="text-xl font-semibold">
            {sessionId ? formatSessionTitle(sessions.find(s => s.sessionId === sessionId) || { sessionId: '', sessionName: 'Untitled Chat', messages: [], createdAt: '' }) : 'New Chat'}
          </h1>
          <p className="text-sm text-gray-500">
            Logged in as {user?.username} ({user?.role})
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isFetching ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <Clock className="h-5 w-5 animate-spin mr-2" />
              Loading messages...
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800'
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="text-xs opacity-75 mt-1 block">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
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
      </div>
    </div>
  );
}