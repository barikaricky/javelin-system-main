import { Router, Request, Response } from 'express';
import pollService from '../services/poll.service';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate as any);

/**
 * @route   GET /api/polls
 * @desc    Get all polls with optional filters
 * @access  Private (Directors only)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, targetRole } = req.query;
    const filters: any = {};

    if (status) filters.status = status as string;
    if (targetRole) filters.targetRole = targetRole as string;

    const polls = await pollService.getAllPolls(filters);
    res.json({ success: true, data: polls });
  } catch (error: any) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch polls' });
  }
});

/**
 * @route   GET /api/polls/stats
 * @desc    Get overall poll statistics
 * @access  Private (Directors only)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await pollService.getPollStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching poll stats:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch poll statistics' });
  }
});

/**
 * @route   GET /api/polls/pending
 * @desc    Get pending mandatory polls for current user
 * @access  Private (All authenticated users)
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const polls = await pollService.getUserPendingPolls(user.userId, user.role);
    res.json({ success: true, data: polls });
  } catch (error: any) {
    console.error('Error fetching pending polls:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch pending polls' });
  }
});

/**
 * @route   GET /api/polls/:id
 * @desc    Get a poll by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const poll = await pollService.getPollById(id);
    res.json({ success: true, data: poll });
  } catch (error: any) {
    console.error('Error fetching poll:', error);
    if (error.message === 'Poll not found') {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch poll' });
  }
});

/**
 * @route   GET /api/polls/:id/results
 * @desc    Get poll results and statistics
 * @access  Private (Directors only)
 */
router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== 'DIRECTOR' && user.role !== 'DEVELOPER')) {
      return res.status(403).json({ success: false, message: 'Access denied. Directors only.' });
    }

    const { id } = req.params;
    const results = await pollService.getPollResults(id);
    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Error fetching poll results:', error);
    if (error.message === 'Poll not found') {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch poll results' });
  }
});

/**
 * @route   POST /api/polls
 * @desc    Create a new poll
 * @access  Private (Directors only)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== 'DIRECTOR' && user.role !== 'DEVELOPER')) {
      return res.status(403).json({ success: false, message: 'Access denied. Directors only.' });
    }

    const { question, description, type, targetRole, isMandatory, expiresAt, options } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const poll = await pollService.createPoll(user.userId, {
      question,
      description,
      type,
      targetRole,
      isMandatory,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      options
    });

    res.status(201).json({ success: true, data: poll, message: 'Poll created successfully' });
  } catch (error: any) {
    console.error('Error creating poll:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create poll' });
  }
});

/**
 * @route   PUT /api/polls/:id
 * @desc    Update a poll
 * @access  Private (Directors only)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== 'DIRECTOR' && user.role !== 'DEVELOPER')) {
      return res.status(403).json({ success: false, message: 'Access denied. Directors only.' });
    }

    const { id } = req.params;
    const { question, description, type, targetRole, isMandatory, status, expiresAt } = req.body;

    const poll = await pollService.updatePoll(id, {
      question,
      description,
      type,
      targetRole,
      isMandatory,
      status,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    res.json({ success: true, data: poll, message: 'Poll updated successfully' });
  } catch (error: any) {
    console.error('Error updating poll:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update poll' });
  }
});

/**
 * @route   DELETE /api/polls/:id
 * @desc    Delete a poll
 * @access  Private (Directors only)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== 'DIRECTOR' && user.role !== 'DEVELOPER')) {
      return res.status(403).json({ success: false, message: 'Access denied. Directors only.' });
    }

    const { id } = req.params;
    await pollService.deletePoll(id);
    res.json({ success: true, message: 'Poll deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete poll' });
  }
});

/**
 * @route   POST /api/polls/:id/close
 * @desc    Close a poll
 * @access  Private (Directors only)
 */
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== 'DIRECTOR' && user.role !== 'DEVELOPER')) {
      return res.status(403).json({ success: false, message: 'Access denied. Directors only.' });
    }

    const { id } = req.params;
    const poll = await pollService.closePoll(id);
    res.json({ success: true, data: poll, message: 'Poll closed successfully' });
  } catch (error: any) {
    console.error('Error closing poll:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to close poll' });
  }
});

/**
 * @route   POST /api/polls/:id/respond
 * @desc    Submit a response to a poll
 * @access  Private (All authenticated users)
 */
router.post('/:id/respond', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { id } = req.params;
    const { selectedOptions, textResponse, scaleValue } = req.body;

    const result = await pollService.submitResponse(id, user.userId, {
      selectedOptions,
      textResponse,
      scaleValue
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error submitting poll response:', error);
    if (error.message.includes('already responded')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === 'Poll not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to submit response' });
  }
});

export default router;
