export interface PollOption {
  id: string;
  option_text: string;
}

export interface Poll {
  id: string;
  question: string;
  is_multiple_choice: boolean;
  is_closed: boolean;
  expires_at: string | null;
  created_at: string;
  options: PollOption[];
}

export interface PollResultOption {
  option_id: string;
  option_text: string;
  votes: number;
  percentage: number;
}

export interface PollResultsResponse {
  poll: {
    id: string;
    question: string;
    is_multiple_choice?: boolean;
    is_closed: boolean;
    expires_at: string | null;
    created_at: string;
  };
  total_votes: number;
  results: PollResultOption[];
}

export interface CreatePollInput {
  question: string;
  options: string[];
  is_multiple_choice?: boolean;
  expires_at?: string | null;
}

export interface CreatePollResponse {
  poll: Poll;
  admin_token: string;
}

export interface TrendingPoll {
  id: string;
  question: string;
  created_at: string;
  is_closed: boolean;
  total_votes: number;
}

export interface StoredPoll {
  id: string;
  question: string;
  admin_token: string;
  created_at: string;
}

const VOTER_TOKEN_KEY = 'quickpoll_voter_token';
const MY_POLLS_KEY = 'quickpoll_my_polls';

export function getOrCreateVoterToken(): string {
  let token = localStorage.getItem(VOTER_TOKEN_KEY);
  if (!token) {
    token = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'voter_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(VOTER_TOKEN_KEY, token);
  }
  return token;
}

export function getMyPolls(): StoredPoll[] {
  try {
    const raw = localStorage.getItem(MY_POLLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyPoll(poll: StoredPoll): void {
  try {
    const polls = getMyPolls();
    const existingIdx = polls.findIndex((p) => p.id === poll.id);
    if (existingIdx >= 0) {
      polls[existingIdx] = poll;
    } else {
      polls.unshift(poll);
    }
    localStorage.setItem(MY_POLLS_KEY, JSON.stringify(polls));
  } catch {
    // Ignore localStorage errors
  }
}

export function getStoredAdminToken(pollId: string): string | null {
  const polls = getMyPolls();
  const match = polls.find((p) => p.id === pollId);
  return match ? match.admin_token : null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = (isJson && data?.error) || res.statusText || 'Request failed';
    const error: any = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  createPoll: (input: CreatePollInput) =>
    request<CreatePollResponse>('/api/polls', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getPoll: (id: string) => request<Poll>(`/api/polls/${id}`),

  submitVote: (id: string, option_ids: string[], voter_token: string) =>
    request<{ success: boolean; message: string }>(`/api/polls/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_ids, voter_token }),
    }),

  getPollResults: (id: string) => request<PollResultsResponse>(`/api/polls/${id}/results`),

  getTrending: () => request<{ trending: TrendingPoll[] }>('/api/polls/feed/trending'),

  closePoll: (id: string, adminToken: string) =>
    request<{ message: string; poll: any }>(`/api/polls/${id}/close`, {
      method: 'PATCH',
      headers: { 'x-admin-token': adminToken },
    }),

  deletePoll: (id: string, adminToken: string) =>
    request<{ message: string }>(`/api/polls/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': adminToken },
    }),
};
