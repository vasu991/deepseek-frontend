import axios from 'axios';
import { Session, Message } from '../types/chat';
import { User } from '../types/auth';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const config = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});


export async function createSession(token: string): Promise<Session> {
  try {
    const response = await axios.get(`${API_URL}/new-session`, config(token));
    console.log('Session created:', response.data);
    return response.data;
  } catch (error) {
    handleError(error as AxiosError, 'Failed to create session');
  }
}

export async function fetchSessions(token: string, user: User): Promise<Session[]> {
  try {
    const response = await axios.get(`${API_URL}/sessions/${user?.username}`, config(token));

    return response.data;
  } catch (error) {
    handleError(error as AxiosError, 'Failed to fetch sessions');
  }
}

export async function fetchSessionMessages(token: string, sessionId: string): Promise<Message[]> {
  try {
    const response = await axios.get(`${API_URL}/chat/${sessionId}`, config(token));
    return response.data;
  } catch (error) {
    handleError(error as AxiosError, 'Failed to fetch session messages');
  }
}

import { AxiosError } from 'axios';

function handleError(error: AxiosError, defaultMessage: string): never {
  const message = (error.response?.data as { error: string })?.error || defaultMessage;
  console.error(message);
  throw new Error(message);
}
