import React from "react";
import { Session } from "../../types/chat";
import { TypeAnimation } from "react-type-animation";

interface ChatHeaderProps {
  sessionId?: string;
  sessions: Session[];
  user: { username: string; role: string };
  formatSessionTitle: (session: Session) => string;
  shouldAnimate: boolean; // New prop to control animation for the current session
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  sessionId,
  sessions,
  user,
  formatSessionTitle,
  shouldAnimate, // Destructure the new prop
}) => {
  const currentSession = sessionId
    ? sessions.find((s) => s.sessionId === sessionId)
    : null;

  const sessionTitle = currentSession
    ? formatSessionTitle(currentSession)
    : "New Chat";

  return (
    <div className="bg-white p-4 shadow">
      <h1 className="text-xl font-semibold">
        {shouldAnimate ? (
          <TypeAnimation
            key={sessionId} // Key forces re-render when sessionId changes
            sequence={[sessionTitle, 1000]} // Display the session title
            wrapper="span"
            speed={20}
            cursor={false}
          />
        ) : (
          sessionTitle
        )}
      </h1>
      <p className="text-sm text-gray-500">
        Logged in as {user.username} ({user.role})
      </p>
    </div>
  );
};