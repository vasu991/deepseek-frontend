import { create } from 'zustand';
import { AuthState, User } from '../types/auth';
import { Session } from '../types/chat';

export const useAuthStore = create<AuthState>((set) => {

  const storedSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const storedToken = localStorage.getItem('token');

  return {
    token: storedToken,
    user: storedUser,
    sessions: storedSessions,

    setToken: (token: string | null) => {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
      set({ token });
    },

    setUser: (user: User | null) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
      set({ user });
    },

    setSessions: (sessions: Session[]) => {
      console.log("Setting sessions in Zustand store:", sessions);
      localStorage.setItem('sessions', JSON.stringify(sessions));
      set({ sessions });
    },

    addSession: (session: Session) => {
      set((state) => {
        if (!session || !session.sessionId) {
          console.error("Invalid session object:", session);
          return state;
        }

        const updatedSessions = [session, ...state.sessions];
        localStorage.setItem("sessions", JSON.stringify(updatedSessions));
        console.log("Session added to Zustand store:", updatedSessions);

        return { sessions: updatedSessions };
      });
    },

    loadSessions: () => {
      const storedSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      console.log("Loaded sessions from localStorage:", storedSessions);
      set({ sessions: storedSessions });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sessions');
      set({ token: null, user: null, sessions: [] });
    },
  };
});
