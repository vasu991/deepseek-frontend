import { Session } from './chat';
export interface User {
    username: string;
    sessions: Session[];
    role: 'user' | 'admin';
}

  export interface AuthState {
    token: string | null;
    user: User | null;
    sessions: Session[];
    setToken: (token: string | null) => void;
    setUser: (user: User | null) => void;
    setSessions: (sessions: Session[]) => void;
    addSession: (session: Session) => void;
    logout: () => void;
}