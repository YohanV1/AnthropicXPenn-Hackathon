import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/analytics/summary
 * Get overall spending summary
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [userId];
    
    if (startDate && endDate) {
      dateFilter = 'AND invoice_date BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_spending,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(AVG(total_amount), 0) as average_invoice,
        COUNT(DISTINCT vendor_name) as unique_vendors,
        COUNT(DISTINCT category) as unique_categories
      FROM invoices 
      WHERE user_id = $1 ${dateFilter}`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve summary' });
  }
});

/**
 * GET /api/analytics/by-category
 * Get spending breakdown by category
 */
router.get('/by-category', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [userId];
    
    if (startDate && endDate) {
      dateFilter = 'AND invoice_date BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        category,
        COUNT(*) as invoice_count,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(AVG(total_amount), 0) as average_amount
      FROM invoices 
      WHERE user_id = $1 ${dateFilter}
      GROUP BY category
      ORDER BY total_amount DESC`,
      params
    );

    res.json({
      categories: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get category breakdown error:', error);
    res.status(500).json({ error: 'Failed to retrieve category breakdown' });
  }
});

/**
 * GET /api/analytics/by-vendor
 * Get spending breakdown by vendor
 */
router.get('/by-vendor', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, limit = 10 } = req.query;

    let dateFilter = '';
    const params = [userId];
    
    if (startDate && endDate) {
      dateFilter = 'AND invoice_date BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        vendor_name,
        COUNT(*) as invoice_count,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        MAX(invoice_date) as last_invoice_date
      FROM invoices 
      WHERE user_id = $1 ${dateFilter}
      GROUP BY vendor_name
      ORDER BY total_amount DESC
      LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    res.json({
      vendors: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get vendor breakdown error:', error);
    res.status(500).json({ error: 'Failed to retrieve vendor breakdown' });
  }
});

/**
 * GET /api/analytics/monthly-trend
 * Get monthly spending trend
 */
router.get('/monthly-trend', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { months = 12 } = req.query;

    const result = await query(
      `SELECT 
        DATE_TRUNC('month', invoice_date) as month,
        COUNT(*) as invoice_count,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(tax_amount), 0) as total_tax
      FROM invoices 
      WHERE user_id = $1 
        AND invoice_date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
      GROUP BY DATE_TRUNC('month', invoice_date)
      ORDER BY month DESC`,
      [userId]
    );

    res.json({
      trend: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get monthly trend error:', error);
    res.status(500).json({ error: 'Failed to retrieve monthly trend' });
  }
});

/**
 * GET /api/analytics/tax-report
 * Get detailed tax report
 */
router.get('/tax-report', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, quarter } = req.query;

    let dateFilter = '';
    const params = [userId];
    
    if (year) {
      if (quarter) {
        const quarterStart = `${year}-${(quarter - 1) * 3 + 1}-01`;
        const quarterEnd = `${year}-${quarter * 3}-31`;
        dateFilter = 'AND invoice_date BETWEEN $2 AND $3';
        params.push(quarterStart, quarterEnd);
      } else {
        dateFilter = "AND EXTRACT(YEAR FROM invoice_date) = $2";
        params.push(year);
      }
    }

    const result = await query(
      `SELECT 
        category,
        COUNT(*) as invoice_count,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        json_agg(
          json_build_object(
            'vendor', vendor_name,
            'invoice_number', invoice_number,
            'date', invoice_date,
            'amount', total_amount,
            'tax', tax_amount
          ) ORDER BY invoice_date
        ) as invoices
      FROM invoices 
      WHERE user_id = $1 ${dateFilter}
      GROUP BY category
      ORDER BY total_tax DESC`,
      params
    );

    const totals = await query(
      `SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(subtotal), 0) as total_subtotal
      FROM invoices 
      WHERE user_id = $1 ${dateFilter}`,
      params
    );

    res.json({
      report: result.rows,
      totals: totals.rows[0],
      period: { year, quarter },
    });
  } catch (error) {
    console.error('Get tax report error:', error);
    res.status(500).json({ error: 'Failed to generate tax report' });
  }
});

/**
 * GET /api/analytics/top-expenses
 * Get top individual expenses
 */
router.get('/top-expenses', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10, startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [userId];
    
    if (startDate && endDate) {
      dateFilter = 'AND invoice_date BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        id,
        vendor_name,
        invoice_number,
        invoice_date,
        total_amount,
        tax_amount,
        category,
        currency
      FROM invoices 
      WHERE user_id = $1 ${dateFilter}
      ORDER BY total_amount DESC
      LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    res.json({
      expenses: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get top expenses error:', error);
    res.status(500).json({ error: 'Failed to retrieve top expenses' });
  }
});

export default router;
