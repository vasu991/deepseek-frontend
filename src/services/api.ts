import axios from "axios";
import { Session, Message } from "../types/chat";
// import { v4 } from "uuid";
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
export async function sendChatStreamMessage(
  token: string,
  sessionId: string,
  prompt: string,
  onData: (content: string) => void
): Promise<void> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/chat/stream`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, prompt }),
      }
    );

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let botMessageContent = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Clean the data by removing "data:" and decoding escaped characters
      let cleanedData = chunk.replace(/data: /g, '').trim();
      cleanedData = cleanedData.replace(/\\u[0-9a-fA-F]{4}/g, (match) =>
        String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
      ); // Decode Unicode escape sequences

      // Remove \n or replace with a space, if necessary
      cleanedData = cleanedData.replace(/\\n/g, ' '); // Replace \n with space or ''

      // Append cleaned data directly (no extra space)
      botMessageContent += cleanedData;
      botMessageContent += " ";


      // Update UI with new data
      onData(botMessageContent);
    }
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
    // console.log("Session name updated:", response.data.session);
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
