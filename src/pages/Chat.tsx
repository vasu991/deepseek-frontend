import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 } from "uuid";
import { useAuthStore } from "../store/authStore";
import { Message, Session } from "../types/chat";
import {
  createSession,
  fetchSessions,
  fetchSessionMessages,
  // sendChatMessage,
  sendChatStreamMessage,
  updateSessionName,
} from "../services/api";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { MessageInput } from "../components/chat/MessageInput";

export function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const sessions = useAuthStore((state) => state.sessions);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [animatedSessions, setAnimatedSessions] = useState<string[]>([]); // Track sessions being animated
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
          storedSessions = JSON.parse(localStorage.getItem("sessions") || "[]");
          if (storedSessions.length > 0) {
            useAuthStore.getState().setSessions(storedSessions);
            console.log(
              "Loaded stored sessions from localStorage:",
              storedSessions
            );
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
            id: "1",
            role: "assistant",
            content: `Hello ${user?.username}! How can I help you today?`,
          },
        ]);
        return;
      }

      try {
        setIsFetching(true);
        const sessionMessages = await fetchSessionMessages(token, sessionId);
        setMessages(sessionMessages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsFetching(false);
      }
    }
    loadMessages();
  }, [sessionId, token, user?.username]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
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

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!input.trim() || !sessionId || !token) return;

  //   const userMessage: Message = {
  //     id: Date.now().toString(),
  //     role: "user",
  //     content: input,
  //   };

  //   // Add user message to UI
  //   setMessages((prev) => [...prev, userMessage]);
  //   setInput("");

  //   try {
  //     const botMessage = await sendChatMessage(token, sessionId, input);
  //     setMessages((prev) => [...prev, botMessage]);

  //     // Check if session name needs updating
  //     const sessionIndex = sessions.findIndex((s) => s.sessionId === sessionId);

  //     if (sessionIndex !== -1 && !sessions[sessionIndex].sessionName) {
  //       const newSessionName = input.substring(0, 30);

  //       // ✅ Update session name in DB & get updated session
  //       const updatedSession = await updateSessionName(token, sessionId, newSessionName);

  //       if (updatedSession) {
  //         // ✅ Update session name in Zustand state
  //         const updatedSessions = [...sessions];
  //         updatedSessions[sessionIndex] = updatedSession;
  //         useAuthStore.getState().setSessions(updatedSessions);

  //         // Add the session to the animatedSessions list
  //         setAnimatedSessions((prev) => [...prev, sessionId]);

  //         // Remove the session from the animatedSessions list after 2 seconds (animation duration)
  //         setTimeout(() => {
  //           setAnimatedSessions((prev) => prev.filter((id) => id !== sessionId));
  //         }, 2000);

  //         // ✅ Navigate to force re-render
  //         setTimeout(() => {
  //           navigate(`/chat/${sessionId}`);
  //         }, 100);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error fetching bot response:", error);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || !token) return;

    const userMessage: Message = {
      id: v4(),
      role: "user",
      content: input,
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      let botMessageContent = '';
      const botMessage: Message = {
        id: v4(),
        role: "assistant",
        content: '',
      };

      // Add an empty assistant message to the UI
      setMessages((prev) => [...prev, botMessage]);

      await sendChatStreamMessage(token, sessionId, input, (content) => {
        botMessageContent = content;
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = botMessageContent;
          }
          return [...prev]; // Update messages state
        });
      });

      // Check if session name needs updating
      const sessionIndex = sessions.findIndex((s) => s.sessionId === sessionId);

      if (sessionIndex !== -1 && !sessions[sessionIndex].sessionName) {
        const newSessionName = input.substring(0, 30);

        // ✅ Update session name in DB & get updated session
        const updatedSession = await updateSessionName(token, sessionId, newSessionName);

        if (updatedSession) {
          // ✅ Update session name in Zustand state
          const updatedSessions = [...sessions];
          updatedSessions[sessionIndex] = updatedSession;
          useAuthStore.getState().setSessions(updatedSessions);

          // Add the session to the animatedSessions list
          setAnimatedSessions((prev) => [...prev, sessionId]);

          // Remove the session from the animatedSessions list after 2 seconds (animation duration)
          setTimeout(() => {
            setAnimatedSessions((prev) => prev.filter((id) => id !== sessionId));
          }, 2000);

          // ✅ Navigate to force re-render
          setTimeout(() => {
            navigate(`/chat/${sessionId}`);
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error fetching bot response:", error);
    }
  };

  const formatSessionTitle = (session: Session) => {
    if (!session) return "New Chat";
    return `${session.sessionName || "Untitled Chat"} - ${formatDate(
      session.createdAt
    )}`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar
        sessions={sessions}
        sessionId={sessionId}
        isLoading={isLoading}
        isFetching={isFetching}
        handleNewChat={handleNewChat}
        logout={logout}
        formatSessionTitle={formatSessionTitle}
        formatDate={formatDate}
        animatedSessions={animatedSessions} // Pass the list of animated sessions
      />

      <div className="flex-1 flex flex-col">
        {user && (
          <ChatHeader
            sessionId={sessionId}
            sessions={sessions}
            user={user}
            formatSessionTitle={formatSessionTitle}
            shouldAnimate={animatedSessions.includes(sessionId || "")} // Pass whether the current session should animate
          />
        )}

        <MessageList messages={messages} isFetching={isFetching} />

        <MessageInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}