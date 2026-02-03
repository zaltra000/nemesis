import { Part } from "@google/genai";

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isThinking?: boolean;
  groundingMetadata?: GroundingMetadata;
  attachments?: Attachment[]; // Visual record of what was sent
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  lastModified: number;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  groundingSupports?: any[];
  webSearchQueries?: string[];
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 string (raw data)
  size: number;
}

export interface AppSettings {
  thinkingBudget: number; // 0 means disabled
  useSearch: boolean;
  jailbreakStabilizer: boolean; // New: "Dark Mirror" Protocol
  temperature: number;
}

export interface GeminiConfig {
  apiKey: string;
}

export type LoadingState = 'idle' | 'thinking' | 'streaming' | 'error';