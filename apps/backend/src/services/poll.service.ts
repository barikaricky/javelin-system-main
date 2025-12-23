import { Poll, PollOption, PollResponse, User, Director } from '../models';
import { logger } from '../utils/logger';

export interface CreatePollData {
  question: string;
  description?: string;
  type: string;
  targetRole?: string;
  isMandatory?: boolean;
  expiresAt?: Date;
  options?: { text: string }[];
}

export interface UpdatePollData {
  question?: string;
  description?: string;
  type?: string;
  targetRole?: string;
  isMandatory?: boolean;
  status?: string;
  expiresAt?: Date;
}

export interface SubmitResponseData {
  selectedOptions?: string[];
  textResponse?: string;
  scaleValue?: number;
}

class PollService {
  /**
   * Create a new poll
   */
  async createPoll(creatorId: string, data: CreatePollData) {
    // First get the director record for the user
    const director = await Director.findOne({ userId: creatorId });

    if (!director) {
      throw new Error('Only directors can create polls');
    }

    const poll = await Poll.create({
      question: data.question,
      description: data.description,
      type: data.type || 'SINGLE_CHOICE',
      targetRole: data.targetRole || 'ALL_USERS',
      isMandatory: data.isMandatory || false,
      expiresAt: data.expiresAt,
      status: 'ACTIVE',
      creatorId: director._id,
    });

    if (data.options && data.options.length > 0) {
      const options = await PollOption.insertMany(
        data.options.map((opt, index) => ({
          pollId: poll._id,
          optionText: opt.text,
          orderIndex: index,
        }))
      );
      poll.options = options.map(o => o._id) as any;
      await poll.save();
    }

    return this.getPollById(poll._id.toString());
  }

  /**
   * Get all polls with optional filters
   */
  async getAllPolls(filters?: { status?: string; targetRole?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.targetRole) {
      where.targetRole = filters.targetRole;
    }

    const polls = await Poll.find(where)
      .populate({
        path: 'creatorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email',
        },
      })
      .sort({ createdAt: -1 });

    const pollsWithOptions = await Promise.all(
      polls.map(async (poll) => {
        const options = await PollOption.find({ pollId: poll._id }).sort({ orderIndex: 1 });
        const responseCount = await PollResponse.countDocuments({ pollId: poll._id });
        return this.formatPoll({ ...poll.toObject(), poll_options: options, _count: { poll_responses: responseCount } });
      })
    );

    return pollsWithOptions;
  }

  /**
   * Get poll by ID
   */
  async getPollById(pollId: string) {
    const poll = await Poll.findById(pollId).populate({
      path: 'creatorId',
      populate: {
        path: 'userId',
        select: 'firstName lastName email',
      },
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    const options = await PollOption.find({ pollId: poll._id }).sort({ orderIndex: 1 });
    const optionsWithCounts = await Promise.all(
      options.map(async (opt) => {
        const count = await PollResponse.countDocuments({ optionId: opt._id });
        return { ...opt.toObject(), _count: { poll_responses: count } };
      })
    );

    const responseCount = await PollResponse.countDocuments({ pollId: poll._id });

    return this.formatPoll({ 
      ...poll.toObject(), 
      poll_options: optionsWithCounts,
      _count: { poll_responses: responseCount }
    });
  }

  /**
   * Update a poll
   */
  async updatePoll(pollId: string, data: UpdatePollData) {
    const poll = await Poll.findByIdAndUpdate(
      pollId,
      {
        question: data.question,
        description: data.description,
        type: data.type,
        targetRole: data.targetRole,
        isMandatory: data.isMandatory,
        status: data.status,
        expiresAt: data.expiresAt,
      },
      { new: true }
    ).populate({
      path: 'creatorId',
      populate: {
        path: 'userId',
        select: 'firstName lastName email',
      },
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    return this.getPollById(pollId);
  }

  /**
   * Delete a poll
   */
  async deletePoll(pollId: string) {
    await Poll.findByIdAndDelete(pollId);
    await PollOption.deleteMany({ pollId });
    await PollResponse.deleteMany({ pollId });
    return { success: true };
  }

  /**
   * Close a poll
   */
  async closePoll(pollId: string) {
    const poll = await Poll.findByIdAndUpdate(
      pollId,
      { status: 'CLOSED' },
      { new: true }
    );

    if (!poll) {
      throw new Error('Poll not found');
    }

    return this.getPollById(pollId);
  }

  /**
   * Submit a response to a poll
   */
  async submitResponse(pollId: string, userId: string, data: SubmitResponseData) {
    const poll = await Poll.findById(pollId);

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.status !== 'ACTIVE') {
      throw new Error('This poll is no longer active');
    }

    if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
      throw new Error('This poll has expired');
    }

    const existingResponse = await PollResponse.findOne({ pollId, userId });

    if (existingResponse) {
      throw new Error('You have already responded to this poll');
    }

    switch (poll.type) {
      case 'SINGLE_CHOICE':
      case 'YES_NO':
        if (!data.selectedOptions || data.selectedOptions.length !== 1) {
          throw new Error('Please select one option');
        }
        await PollResponse.create({
          pollId,
          userId,
          optionId: data.selectedOptions[0],
        });
        break;

      case 'MULTIPLE_CHOICE':
        if (!data.selectedOptions || data.selectedOptions.length === 0) {
          throw new Error('Please select at least one option');
        }
        for (const optionId of data.selectedOptions) {
          await PollResponse.create({ pollId, userId, optionId });
        }
        break;

      case 'SCALE':
        if (data.scaleValue === undefined || data.scaleValue < 1 || data.scaleValue > 5) {
          throw new Error('Please select a scale value between 1 and 5');
        }
        await PollResponse.create({ pollId, userId, scaleValue: data.scaleValue });
        break;

      case 'TEXT':
        if (!data.textResponse || data.textResponse.trim() === '') {
          throw new Error('Please provide a text response');
        }
        await PollResponse.create({ pollId, userId, textResponse: data.textResponse.trim() });
        break;

      default:
        throw new Error('Invalid poll type');
    }

    return { success: true, message: 'Response submitted successfully' };
  }

  /**
   * Get pending mandatory polls for a user
   */
  async getUserPendingPolls(userId: string, userRole: string) {
    const mandatoryPolls = await Poll.find({
      status: 'ACTIVE',
      isMandatory: true,
      $or: [
        { targetRole: 'ALL_USERS' },
        { targetRole: userRole },
      ],
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    const pendingPolls = [];
    for (const poll of mandatoryPolls) {
      const hasResponded = await PollResponse.findOne({ pollId: poll._id, userId });
      if (!hasResponded) {
        const options = await PollOption.find({ pollId: poll._id }).sort({ orderIndex: 1 });
        pendingPolls.push(this.formatPoll({ ...poll.toObject(), poll_options: options }));
      }
    }

    return pendingPolls;
  }

  /**
   * Get poll results/statistics
   */
  async getPollResults(pollId: string) {
    const poll = await Poll.findById(pollId).populate({
      path: 'creatorId',
      populate: {
        path: 'userId',
        select: 'firstName lastName',
      },
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    const options = await PollOption.find({ pollId: poll._id }).sort({ orderIndex: 1 });
    const responses = await PollResponse.find({ pollId: poll._id }).populate({
      path: 'userId',
      select: 'firstName lastName role',
    });

    const results: any = {
      poll: this.formatPoll({ ...poll.toObject(), poll_options: options }),
      totalResponses: responses.length,
      options: [],
    };

    if (poll.type === 'SINGLE_CHOICE' || poll.type === 'MULTIPLE_CHOICE' || poll.type === 'YES_NO') {
      results.options = await Promise.all(
        options.map(async (option) => {
          const optionResponses = responses.filter(r => r.optionId?.toString() === option._id.toString());
          return {
            id: option._id,
            text: option.optionText,
            responseCount: optionResponses.length,
            percentage: responses.length > 0 ? Math.round((optionResponses.length / responses.length) * 100) : 0,
            respondents: optionResponses.map(r => ({
              id: (r.userId as any)._id,
              name: `${(r.userId as any).firstName} ${(r.userId as any).lastName}`,
              role: (r.userId as any).role,
            })),
          };
        })
      );
    } else if (poll.type === 'SCALE') {
      const scaleResponses = responses.filter(r => r.scaleValue !== null && r.scaleValue !== undefined);
      const scaleDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      scaleResponses.forEach(r => {
        if (r.scaleValue) {
          scaleDistribution[r.scaleValue]++;
        }
      });

      const average = scaleResponses.length > 0
        ? scaleResponses.reduce((sum, r) => sum + (r.scaleValue || 0), 0) / scaleResponses.length
        : 0;

      results.scaleResults = {
        distribution: scaleDistribution,
        average: Math.round(average * 100) / 100,
        responses: scaleResponses.map(r => ({
          value: r.scaleValue,
          user: {
            id: (r.userId as any)._id,
            name: `${(r.userId as any).firstName} ${(r.userId as any).lastName}`,
            role: (r.userId as any).role,
          },
          createdAt: r.createdAt,
        })),
      };
    } else if (poll.type === 'TEXT') {
      results.textResponses = responses
        .filter(r => r.textResponse)
        .map(r => ({
          text: r.textResponse,
          user: {
            id: (r.userId as any)._id,
            name: `${(r.userId as any).firstName} ${(r.userId as any).lastName}`,
            role: (r.userId as any).role,
          },
          createdAt: r.createdAt,
        }));
    }

    const roleBreakdown: Record<string, number> = {};
    responses.forEach(r => {
      const role = (r.userId as any).role;
      roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
    });
    results.roleBreakdown = roleBreakdown;

    return results;
  }

  /**
   * Get overall poll statistics
   */
  async getPollStats() {
    const [totalPolls, activePolls, mandatoryPolls, totalResponses] = await Promise.all([
      Poll.countDocuments(),
      Poll.countDocuments({ status: 'ACTIVE' }),
      Poll.countDocuments({ isMandatory: true, status: 'ACTIVE' }),
      PollResponse.countDocuments(),
    ]);

    const recentPolls = await Poll.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPollsWithCounts = await Promise.all(
      recentPolls.map(async (p) => {
        const responseCount = await PollResponse.countDocuments({ pollId: p._id });
        return {
          id: p._id,
          question: p.question,
          status: p.status,
          responseCount,
          createdAt: p.createdAt,
        };
      })
    );

    return {
      totalPolls,
      activePolls,
      mandatoryPolls,
      totalResponses,
      recentPolls: recentPollsWithCounts,
    };
  }

  /**
   * Format poll data for API response
   */
  private formatPoll(poll: any) {
    const director = poll.creatorId || poll.directors;
    return {
      id: poll._id,
      question: poll.question,
      description: poll.description,
      type: poll.type,
      targetRole: poll.targetRole,
      isMandatory: poll.isMandatory,
      status: poll.status,
      expiresAt: poll.expiresAt,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      options: poll.poll_options?.map((opt: any) => ({
        id: opt._id,
        text: opt.optionText,
        orderIndex: opt.orderIndex,
        responseCount: opt._count?.poll_responses || 0,
      })),
      responseCount: poll._count?.poll_responses || 0,
      createdBy: director?.userId ? {
        name: `${director.userId.firstName} ${director.userId.lastName}`,
        email: director.userId.email,
      } : null,
    };
  }
}

export default new PollService();
