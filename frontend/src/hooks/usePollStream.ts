import { useEffect, useRef, useState, useCallback } from "react";
import { streamUrl, normalizePoll } from "../api/polls";
import type { Poll } from "../types";

type StreamState = "connecting" | "open" | "closed" | "error";

export function usePollStream(pollId: string | undefined, onPoll: (p: Poll) => void) {
  const [state, setState] = useState<StreamState>("closed");
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const onPollRef = useRef(onPoll);
  onPollRef.current = onPoll;

  const cleanup = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!pollId) return;
    cleanup();
    setState("connecting");
    try {
      const es = new EventSource(streamUrl(pollId));
      esRef.current = es;

      es.onopen = () => {
        setState("open");
        retryRef.current = 0;
      };

      const handleMessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as Record<string, unknown>;
          // Vote event carries poll/results; status carries poll
          const pollRaw =
            (data.poll as Record<string, unknown> | undefined) ??
            (data.data as Record<string, unknown> | undefined) ??
            (data as Record<string, unknown>);
          if (pollRaw && (pollRaw.question || pollRaw.options || pollRaw.id || pollRaw._id)) {
            const maybePoll = pollRaw.question ? pollRaw : (pollRaw.poll as Record<string, unknown> | undefined) ?? pollRaw;
            if (maybePoll && typeof maybePoll === "object" && ("question" in maybePoll || "options" in maybePoll)) {
              onPollRef.current(normalizePoll(maybePoll as Record<string, unknown>));
            }
          }
        } catch {
          /* ignore malformed */
        }
      };

      es.onmessage = handleMessage;
      es.addEventListener("vote", handleMessage as EventListener);
      es.addEventListener("update", handleMessage as EventListener);
      es.addEventListener("poll", handleMessage as EventListener);
      es.addEventListener("status", handleMessage as EventListener);

      es.onerror = () => {
        setState("error");
        es.close();
        esRef.current = null;
        const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
        retryRef.current += 1;
        timerRef.current = window.setTimeout(connect, delay);
      };
    } catch {
      setState("error");
      const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
      retryRef.current += 1;
      timerRef.current = window.setTimeout(connect, delay);
    }
  }, [pollId, cleanup]);

  useEffect(() => {
    if (!pollId) {
      setState("closed");
      return;
    }
    connect();
    return cleanup;
  }, [pollId, connect, cleanup]);

  return { state, reconnect: connect };
}
