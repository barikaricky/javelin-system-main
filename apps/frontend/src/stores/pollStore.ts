import { create } from 'zustand';
import { Poll, PollResponse, PollStats, CreatePollData } from '../types/poll';
import { pollService } from '../services/pollService';

interface PollState {
  // Polls data
  polls: Poll[];
  activePolls: Poll[];
  pendingMandatoryPolls: Poll[];
  currentPoll: Poll | null;
  pollStats: PollStats | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchPolls: () => Promise<void>;
  fetchActivePolls: () => Promise<void>;
  fetchPendingMandatoryPolls: () => Promise<void>;
  fetchPollById: (id: string) => Promise<void>;
  fetchPollStats: () => Promise<void>;
  createPoll: (data: CreatePollData) => Promise<Poll>;
  updatePoll: (id: string, data: Partial<Poll>) => Promise<void>;
  deletePoll: (id: string) => Promise<void>;
  submitResponse: (pollId: string, response: Partial<PollResponse>) => Promise<void>;
  closePoll: (id: string) => Promise<void>;
  clearCurrentPoll: () => void;
  clearError: () => void;
  removePollFromPending: (pollId: string) => void;
}

const usePollStore = create<PollState>((set, get) => ({
  // Initial state
  polls: [],
  activePolls: [],
  pendingMandatoryPolls: [],
  currentPoll: null,
  pollStats: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Fetch all polls
  fetchPolls: async () => {
    set({ isLoading: true, error: null });
    try {
      const polls = await pollService.getAllPolls();
      set({ polls, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch polls:', error);
      set({ 
        error: 'Failed to fetch polls', 
        isLoading: false,
        polls: [] 
      });
    }
  },

  // Fetch active polls only
  fetchActivePolls: async () => {
    set({ isLoading: true, error: null });
    try {
      const polls = await pollService.getAllPolls({ status: 'ACTIVE' });
      set({ activePolls: polls, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch active polls:', error);
      set({ 
        error: 'Failed to fetch active polls', 
        isLoading: false,
        activePolls: [] 
      });
    }
  },

  // Fetch pending mandatory polls for current user
  fetchPendingMandatoryPolls: async () => {
    set({ isLoading: true, error: null });
    try {
      const polls = await pollService.getUserPendingPolls();
      const mandatoryPolls = polls.filter((p: Poll) => p.isMandatory);
      set({ pendingMandatoryPolls: mandatoryPolls, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch pending mandatory polls:', error);
      set({ 
        error: 'Failed to fetch pending polls', 
        isLoading: false,
        pendingMandatoryPolls: [] 
      });
    }
  },

  // Fetch a specific poll by ID
  fetchPollById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const poll = await pollService.getPollById(id);
      set({ currentPoll: poll, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch poll:', error);
      set({ 
        error: 'Failed to fetch poll', 
        isLoading: false,
        currentPoll: null 
      });
    }
  },

  // Fetch poll statistics
  fetchPollStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await pollService.getPollStats();
      set({ pollStats: stats, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch poll stats:', error);
      set({ 
        error: 'Failed to fetch poll statistics', 
        isLoading: false,
        pollStats: null 
      });
    }
  },

  // Create a new poll
  createPoll: async (data: CreatePollData) => {
    set({ isSubmitting: true, error: null });
    try {
      const newPoll = await pollService.createPoll(data);
      const { polls } = get();
      set({ 
        polls: [newPoll, ...polls], 
        isSubmitting: false 
      });
      return newPoll;
    } catch (error) {
      console.error('Failed to create poll:', error);
      set({ 
        error: 'Failed to create poll', 
        isSubmitting: false 
      });
      throw error;
    }
  },

  // Update an existing poll
  updatePoll: async (id: string, data: Partial<Poll>) => {
    set({ isSubmitting: true, error: null });
    try {
      const updatedPoll = await pollService.updatePoll(id, data);
      const { polls } = get();
      set({ 
        polls: polls.map(p => p.id === id ? updatedPoll : p),
        currentPoll: get().currentPoll?.id === id ? updatedPoll : get().currentPoll,
        isSubmitting: false 
      });
    } catch (error) {
      console.error('Failed to update poll:', error);
      set({ 
        error: 'Failed to update poll', 
        isSubmitting: false 
      });
      throw error;
    }
  },

  // Delete a poll
  deletePoll: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await pollService.deletePoll(id);
      const { polls, activePolls } = get();
      set({ 
        polls: polls.filter(p => p.id !== id),
        activePolls: activePolls.filter(p => p.id !== id),
        currentPoll: get().currentPoll?.id === id ? null : get().currentPoll,
        isSubmitting: false 
      });
    } catch (error) {
      console.error('Failed to delete poll:', error);
      set({ 
        error: 'Failed to delete poll', 
        isSubmitting: false 
      });
      throw error;
    }
  },

  // Submit a response to a poll
  submitResponse: async (pollId: string, response: Partial<PollResponse>) => {
    set({ isSubmitting: true, error: null });
    try {
      await pollService.submitResponse(pollId, response);
      
      // Remove from pending if it was mandatory
      const { pendingMandatoryPolls } = get();
      set({ 
        pendingMandatoryPolls: pendingMandatoryPolls.filter(p => p.id !== pollId),
        isSubmitting: false 
      });
    } catch (error) {
      console.error('Failed to submit response:', error);
      set({ 
        error: 'Failed to submit response', 
        isSubmitting: false 
      });
      throw error;
    }
  },

  // Close a poll
  closePoll: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await pollService.closePoll(id);
      const { polls, activePolls } = get();
      set({ 
        polls: polls.map(p => p.id === id ? { ...p, status: 'CLOSED' as const } : p),
        activePolls: activePolls.filter(p => p.id !== id),
        isSubmitting: false 
      });
    } catch (error) {
      console.error('Failed to close poll:', error);
      set({ 
        error: 'Failed to close poll', 
        isSubmitting: false 
      });
      throw error;
    }
  },

  // Clear current poll
  clearCurrentPoll: () => {
    set({ currentPoll: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Remove a poll from pending list (after submission)
  removePollFromPending: (pollId: string) => {
    const { pendingMandatoryPolls } = get();
    set({ 
      pendingMandatoryPolls: pendingMandatoryPolls.filter(p => p.id !== pollId)
    });
  },
}));

export default usePollStore;
