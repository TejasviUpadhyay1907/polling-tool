export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  totalVotes: number;
  createdAt: string;
  expiresAt?: string | null;
  creatorId?: string;
  creatorName?: string;
  showResultsBeforeVote?: boolean;
}

export interface PollResults {
  pollId: string;
  totalVotes: number;
  options: { id: string; text: string; votes: number; percentage: number }[];
}

export interface CreatePollPayload {
  question: string;
  options: string[];
  expiresAt?: string | null;
  showResultsBeforeVote?: boolean;
}

export type StreamEvent =
  | { type: "vote"; poll: Poll; results: PollResults }
  | { type: "status"; poll: Poll }
  | { type: "connected"; pollId: string }
  | { type: string; [k: string]: unknown };
