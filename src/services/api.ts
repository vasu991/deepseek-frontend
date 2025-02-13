import axios from "axios";
import { Session, Message } from "../types/chat";
import { User } from "../types/auth";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const config = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

export async function createSession(token: string): Promise<Session> {
  try {
    const response = await axios.get(
      `${API_URL}/api/session/new-session`,
      config(token)
    );
    console.log("Session created:", response.data);
    return response.data;
  } catch (error) {
    handleError(error as AxiosError, "Failed to create session");
  }
}

export async function fetchSessions(
  token: string,
  user: User
): Promise<Session[]> {
  try {
    const response = await axios.get(
      `${API_URL}/api/session/sessions/${user?.username}`,
      config(token)
    );

    return response.data;
  } catch (error) {
    handleError(error as AxiosError, "Failed to fetch sessions");
  }
}

export async function fetchSessionMessages(
  token: string,
  sessionId: string
): Promise<Message[]> {
  try {
    const response = await axios.get(
      `${API_URL}/api/chat/${sessionId}`,
      config(token)
    );
    return response.data;
  } catch (error) {
    handleError(error as AxiosError, "Failed to fetch session messages");
  }
}

// Function to send a chat message
export async function sendChatMessage(
  token: string,
  sessionId: string,
  prompt: string
): Promise<Message> {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/chat`,
      {
        sessionId,
        prompt,
      },
      config(token)
    );

    // console.log("Chat message sent:", response.data);

    // Return the bot's response as a Message object
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: response.data.response,
    };
  } catch (error) {
    handleError(error as AxiosError, "Failed to send chat message");
  }
}

export async function updateSessionName(
  token: string,
  sessionId: string,
  sessionName: string
): Promise<Session> {
  try {
    const response = await axios.post(
      `${API_URL}/api/session/${sessionId}/update-name`,
      { sessionName },
      config(token)
    );
    console.log("Session name updated:", response.data.session);
    return response.data.session;
  } catch (error) {
    handleError(error as AxiosError, "Failed to update session name");
  }
}

import { AxiosError } from "axios";

function handleError(error: AxiosError, defaultMessage: string): never {
  const message =
    (error.response?.data as { error: string })?.error || defaultMessage;
  console.error(message);
  throw new Error(message);
}
