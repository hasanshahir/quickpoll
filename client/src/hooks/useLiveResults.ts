import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import type { PollResultsResponse } from '../api';

export type LiveStreamStatus = 'connecting' | 'live' | 'reconnecting' | 'polling' | 'error';

export function useLiveResults(pollId: string | undefined) {
  const [data, setData] = useState<PollResultsResponse | null>(null);
  const [status, setStatus] = useState<LiveStreamStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [pollDeleted, setPollDeleted] = useState(false);

  const errorCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<number | null>(null);

  const fetchCurrentResults = useCallback(async () => {
    if (!pollId) return;
    try {
      const res = await api.getPollResults(pollId);
      setData(res);
      setError(null);
    } catch (err: any) {
      if (err.status === 404) {
        setError('Poll not found.');
      } else {
        setError(err.message || 'Failed to load results.');
      }
    }
  }, [pollId]);

  useEffect(() => {
    if (!pollId) return;

    errorCountRef.current = 0;
    setPollDeleted(false);
    setStatus('connecting');

    // 1. Initial fetch
    fetchCurrentResults().then(() => {
      // 2. Setup EventSource for SSE live stream
      setupEventSource();
    });

    function setupEventSource() {
      if (!pollId) return;
      cleanupEventSource();

      const es = new EventSource(`/api/polls/${pollId}/stream`);
      eventSourceRef.current = es;

      es.onopen = () => {
        errorCountRef.current = 0;
        setStatus('live');
        setError(null);
      };

      es.onmessage = (event) => {
        try {
          const freshData: PollResultsResponse = JSON.parse(event.data);
          setData(freshData);
          setStatus('live');
        } catch {
          // Ignore malformed heartbeats/comments
        }
      };

      es.addEventListener('deleted', () => {
        setPollDeleted(true);
        cleanupEventSource();
      });

      es.onerror = () => {
        errorCountRef.current += 1;
        if (errorCountRef.current >= 3) {
          // Fall back to 5s polling only if EventSource errors repeatedly
          cleanupEventSource();
          startPollingFallback();
        } else {
          setStatus('reconnecting');
        }
      };
    }

    function startPollingFallback() {
      setStatus('polling');
      // Execute immediate poll then interval every 5000ms
      fetchCurrentResults();
      pollingTimerRef.current = window.setInterval(() => {
        fetchCurrentResults();
      }, 5000);
    }

    function cleanupEventSource() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }

    function cleanupPolling() {
      if (pollingTimerRef.current !== null) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    }

    return () => {
      cleanupEventSource();
      cleanupPolling();
    };
  }, [pollId, fetchCurrentResults]);

  return {
    data,
    status,
    error,
    pollDeleted,
    refetch: fetchCurrentResults,
  };
}
