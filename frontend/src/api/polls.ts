import { api } from "./client";
import type { Poll, CreatePollPayload, PollResults } from "../types";

function normalizePoll(raw: Record<string, unknown>): Poll {
  const id = (raw.id ?? raw._id ?? raw.pollId ?? "") as string;
  const optionsRaw = (raw.options ?? []) as Array<Record<string, unknown>>;
  const options = optionsRaw.map((o, i) => ({
    id: (o.id ?? o._id ?? String(i)) as string,
    text: (o.text ?? o.label ?? o.option ?? "") as string,
    votes: (o.votes ?? o.count ?? 0) as number,
  }));
  const totalVotes =
    (raw.totalVotes as number | undefined) ??
    (raw.total_votes as number | undefined) ??
    options.reduce((s, o) => s + o.votes, 0);
  return {
    id: String(id),
    question: (raw.question ?? raw.title ?? "") as string,
    options,
    isActive: (raw.isActive ?? raw.is_active ?? raw.active ?? true) as boolean,
    totalVotes,
    createdAt: (raw.createdAt ?? raw.created_at ?? new Date().toISOString()) as string,
    expiresAt: (raw.expiresAt ?? raw.expires_at ?? null) as string | null,
    creatorId: (raw.creatorId ?? raw.creator_id ?? raw.userId) as string | undefined,
    creatorName: (raw.creatorName ?? raw.creator_name) as string | undefined,
    showResultsBeforeVote: raw.showResultsBeforeVote as boolean | undefined,
  };
}

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if ("data" in d) return d.data as T;
    if ("poll" in d) return d.poll as T;
    if ("polls" in d) return d.polls as T;
  }
  return data as T;
}

export async function fetchMyPolls(): Promise<Poll[]> {
  const { data } = await api.get("/polls/my");
  const list = unwrap<Poll[] | Record<string, unknown>[]>(data);
  const arr = Array.isArray(list) ? list : [];
  return arr.map((p) => normalizePoll(p as Record<string, unknown>));
}

export async function fetchPoll(id: string): Promise<Poll> {
  const { data } = await api.get(`/polls/${id}`);
  const raw = unwrap<Record<string, unknown>>(data);
  return normalizePoll(raw as Record<string, unknown>);
}

export async function createPoll(payload: CreatePollPayload): Promise<Poll> {
  const { data } = await api.post("/polls", payload);
  const raw = unwrap<Record<string, unknown>>(data);
  return normalizePoll(raw as Record<string, unknown>);
}

export async function togglePoll(id: string): Promise<Poll> {
  const { data } = await api.patch(`/polls/${id}/toggle`);
  const raw = unwrap<Record<string, unknown>>(data);
  return normalizePoll(raw as Record<string, unknown>);
}

export async function deletePoll(id: string): Promise<void> {
  await api.delete(`/polls/${id}`);
}

export async function votePoll(id: string, optionId: string): Promise<{ poll: Poll; results?: PollResults }> {
  // Get or generate a persistent browser voter ID
  // Incognito = fresh localStorage = new ID = treated as different voter
  let voterId = localStorage.getItem("pulsep_voter_id");
  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem("pulsep_voter_id", voterId);
  }

  const { data } = await api.post(`/polls/${id}/vote`, {
    optionId,
    option_id: optionId,
    voterId,
  });
  const raw = unwrap<Record<string, unknown>>(data);
  if (raw && typeof raw === "object" && "poll" in raw) {
    return {
      poll: normalizePoll((raw as Record<string, unknown>).poll as Record<string, unknown>),
      results: (raw as Record<string, unknown>).results as PollResults | undefined,
    };
  }
  if (raw && typeof raw === "object" && ("question" in raw || "options" in raw)) {
    return { poll: normalizePoll(raw as Record<string, unknown>) };
  }
  return { poll: normalizePoll(raw as Record<string, unknown>) };
}

export function streamUrl(pollId: string): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";
  const token = localStorage.getItem("pulsep_token");
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${base}/api/polls/${pollId}/stream${q}`;
}

export { normalizePoll };
