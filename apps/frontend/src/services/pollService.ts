// Poll Service - Frontend API calls for poll management
import { api } from '../lib/api';
import type { Poll, CreatePollData, PollStats, PollResultSummary, PollResponse } from '../types/poll';

const POLL_API = '/polls';

export const pollService = {
  // ============ Director Operations ============
  
  // Create a new poll
  async createPoll(data: CreatePollData): Promise<Poll> {
    const response = await api.post(POLL_API, data);
    return response.data.data || response.data;
  },

  // Get all polls (for director)
  async getAllPolls(filters?: {
    status?: string;
    targetRole?: string;
  }): Promise<Poll[]> {
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.targetRole) {
      params.append('targetRole', filters.targetRole);
    }
    const response = await api.get(`${POLL_API}?${params.toString()}`);
    return response.data.data || response.data;
  },

  // Get poll by ID with results
  async getPollById(pollId: string): Promise<Poll> {
    const response = await api.get(`${POLL_API}/${pollId}`);
    return response.data.data || response.data;
  },

  // Get poll statistics
  async getPollStats(): Promise<PollStats> {
    const response = await api.get(`${POLL_API}/stats`);
    return response.data.data || response.data;
  },

  // Get detailed poll results
  async getPollResults(pollId: string): Promise<PollResultSummary> {
    const response = await api.get(`${POLL_API}/${pollId}/results`);
    return response.data.data || response.data;
  },

  // Update poll (only before any responses)
  async updatePoll(pollId: string, data: Partial<Poll>): Promise<Poll> {
    const response = await api.put(`${POLL_API}/${pollId}`, data);
    return response.data.data || response.data;
  },

  // Close/deactivate poll
  async closePoll(pollId: string): Promise<Poll> {
    const response = await api.post(`${POLL_API}/${pollId}/close`);
    return response.data.data || response.data;
  },

  // Reactivate poll
  async reactivatePoll(pollId: string, expiresAt?: string): Promise<Poll> {
    const response = await api.patch(`${POLL_API}/${pollId}/reactivate`, { expiresAt });
    return response.data.data || response.data;
  },

  // Delete poll
  async deletePoll(pollId: string): Promise<void> {
    await api.delete(`${POLL_API}/${pollId}`);
  },

  // ============ User Operations ============

  // Get pending mandatory polls for current user
  async getUserPendingPolls(): Promise<Poll[]> {
    const response = await api.get(`${POLL_API}/pending`);
    return response.data.data || response.data;
  },

  // Get mandatory polls that user hasn't answered
  async getMandatoryPolls(): Promise<Poll[]> {
    const response = await api.get(`${POLL_API}/pending`);
    return response.data.data || response.data;
  },

  // Get active polls for current user
  async getActivePolls(): Promise<Poll[]> {
    const response = await api.get(`${POLL_API}?status=ACTIVE`);
    return response.data.data || response.data;
  },

  // Submit poll response
  async submitResponse(pollId: string, response: Partial<PollResponse>): Promise<{ success: boolean; message: string }> {
    const res = await api.post(`${POLL_API}/${pollId}/respond`, response);
    return res.data;
  },

  // Check if user has pending mandatory polls
  async hasPendingMandatoryPolls(): Promise<{ hasPending: boolean; count: number }> {
    try {
      const polls = await pollService.getUserPendingPolls();
      return { hasPending: polls.length > 0, count: polls.length };
    } catch {
      return { hasPending: false, count: 0 };
    }
  },

  // Get user's poll history
  async getMyPollHistory(): Promise<Poll[]> {
    const response = await api.get(`${POLL_API}/my-responses`);
    return response.data.data || response.data;
  },
};

export default pollService;
