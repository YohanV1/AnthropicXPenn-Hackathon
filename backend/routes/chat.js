import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateChatResponse } from '../services/claude.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * POST /api/chat
 * Send a message to the AI assistant
 */
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user's invoice data for context
    const invoicesResult = await query(
      `SELECT 
        i.id, i.vendor_name, i.invoice_number, i.invoice_date, 
        i.total_amount, i.tax_amount, i.category, i.currency,
        json_agg(
          json_build_object(
            'description', ii.description,
            'quantity', ii.quantity,
            'unit_price', ii.unit_price,
            'total_price', ii.total_price
          )
        ) FILTER (WHERE ii.id IS NOT NULL) as items
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.user_id = $1
      GROUP BY i.id
      ORDER BY i.invoice_date DESC
      LIMIT 50`,
      [userId]
    );

    // Get recent chat history
    const historyResult = await query(
      `SELECT role, content 
       FROM chat_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );

    const chatHistory = historyResult.rows.reverse(); // Oldest first

    // Generate AI response
    const aiResponse = await generateChatResponse(
      message,
      invoicesResult.rows,
      chatHistory
    );

    if (!aiResponse.success) {
      return res.status(500).json({ error: 'Failed to generate response' });
    }

    // Save conversation to database
    await query(
      'INSERT INTO chat_history (user_id, role, content) VALUES ($1, $2, $3)',
      [userId, 'user', message]
    );

    await query(
      'INSERT INTO chat_history (user_id, role, content) VALUES ($1, $2, $3)',
      [userId, 'assistant', aiResponse.message]
    );

    res.json({
      message: aiResponse.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * GET /api/chat/history
 * Get chat history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50 } = req.query;

    const result = await query(
      `SELECT id, role, content, created_at 
       FROM chat_history 
       WHERE user_id = $1 
       ORDER BY created_at ASC 
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      history: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

/**
 * DELETE /api/chat/history
 * Clear chat history
 */
router.delete('/history', async (req, res) => {
  try {
    const userId = req.user.userId;

    await query('DELETE FROM chat_history WHERE user_id = $1', [userId]);

    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

export default router;
