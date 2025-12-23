// Poll Types and Interfaces

export type PollType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'YES_NO' | 'TEXT';
export type PollStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface PollOption {
  id: string;
  pollId?: string;
  text: string; // Changed from optionText to text
  optionText?: string; // Keep for backward compatibility
  orderIndex?: number;
  voteCount?: number;
  responseCount?: number;
  percentage?: number;
}

export interface Poll {
  id: string;
  creatorId?: string;
  question: string;
  description?: string;
  type: PollType;
  status: PollStatus;
  targetRole?: string | null; // null means all roles
  isActive?: boolean;
  isMandatory: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  options?: PollOption[];
  createdBy?: {
    name: string;
    email?: string;
  };
  creator?: {
    firstName: string;
    lastName: string;
  };
  responseCount?: number;
  totalVotes?: number;
  hasVoted?: boolean;
  userResponse?: {
    optionId: string;
    createdAt: string;
  };
}

export interface CreatePollData {
  question: string;
  description?: string;
  type: PollType;
  options?: { text: string }[];
  targetRole?: string | null;
  isMandatory?: boolean;
  expiresAt?: string | null;
}

export interface PollResponse {
  id: string;
  pollId: string;
  optionId?: string;
  userId: string;
  textResponse?: string;
  scaleValue?: number;
  selectedOptions?: string[];
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface PollStats {
  totalPolls: number;
  activePolls: number;
  mandatoryPolls?: number;
  expiredPolls?: number;
  totalResponses: number;
  averageResponseRate?: number;
  recentPolls?: Array<{
    id: string;
    question: string;
    status: PollStatus;
    responseCount: number;
    createdAt: string;
  }>;
}

export interface PollResultSummary {
  poll?: Poll;
  options?: Array<{
    id: string;
    text: string;
    optionText?: string;
    responseCount: number;
    percentage: number;
    respondents?: Array<{
      id: string;
      name: string;
      role: string;
    }>;
  }>;
  totalResponses: number;
  totalVotes?: number;
  responseRate?: number;
  responsesByRole?: Record<string, number>;
  roleBreakdown?: Record<string, number>;
  scaleResults?: {
    distribution: Record<number, number>;
    average: number;
    responses: Array<{
      value: number;
      user: { id: string; name: string; role: string };
      createdAt: string;
    }>;
  };
  textResponses?: Array<{
    text: string;
    user: { id: string; name: string; role: string };
    createdAt: string;
  }>;
}
