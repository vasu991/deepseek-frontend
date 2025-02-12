export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

  export interface Session {
    sessionName: string;
    sessionId: string;
    messages: Message[];
    createdAt: string;
}