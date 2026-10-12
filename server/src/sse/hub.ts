import { Response } from 'express';

export class SSEHub {
  private clients: Map<string, Set<Response>> = new Map();

  /**
   * Subscribes an Express Response connection to a specific pollId stream.
   * Starts a 25-second heartbeat comment (: heartbeat\n\n) to keep HTTP proxies alive.
   * Returns a cleanup function.
   */
  subscribe(pollId: string, res: Response): () => void {
    if (!this.clients.has(pollId)) {
      this.clients.set(pollId, new Set());
    }
    const pollClients = this.clients.get(pollId)!;
    pollClients.add(res);

    // 25s heartbeat comment to prevent proxy and browser timeouts
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        this.unsubscribe(pollId, res);
        clearInterval(heartbeatTimer);
      }
    }, 25000);

    const cleanup = () => {
      clearInterval(heartbeatTimer);
      this.unsubscribe(pollId, res);
    };

    return cleanup;
  }

  /**
   * Unsubscribes a client from a poll's SSE stream.
   */
  unsubscribe(pollId: string, res: Response): void {
    const pollClients = this.clients.get(pollId);
    if (pollClients) {
      pollClients.delete(res);
      if (pollClients.size === 0) {
        this.clients.delete(pollId);
      }
    }
  }

  /**
   * Broadcasts a JSON payload (with optional named event) to all active subscribers of a poll.
   */
  broadcast(pollId: string, data: unknown, event?: string): void {
    const pollClients = this.clients.get(pollId);
    if (!pollClients || pollClients.size === 0) {
      return;
    }

    const payload = event
      ? `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      : `data: ${JSON.stringify(data)}\n\n`;

    for (const client of Array.from(pollClients)) {
      try {
        client.write(payload);
      } catch {
        this.unsubscribe(pollId, client);
      }
    }
  }

  /**
   * Returns current active listener count for testing and diagnostics.
   */
  getSubscriberCount(pollId: string): number {
    return this.clients.get(pollId)?.size ?? 0;
  }
}

export const sseHub = new SSEHub();
