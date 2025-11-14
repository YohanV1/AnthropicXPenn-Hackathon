import express from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadFile, getPresignedUrl, deleteFile } from '../services/s3.js';
import { extractInvoiceData, categorizeInvoice } from '../services/claude.js';

const router = express.Router();

// All invoice routes require authentication
router.use(authenticateToken);

/**
 * POST /api/invoices/upload
 * Upload and process an invoice
 */
router.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.invoice) {
      return res.status(400).json({ error: 'No invoice file uploaded' });
    }

    const file = req.files.invoice;
    const userId = req.user.userId;

    // Upload to S3
    const uploadResult = await uploadFile(
      file.data,
      file.name,
      file.mimetype,
      userId
    );

    if (!uploadResult.success) {
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    // Extract invoice data using Claude AI
    const extractionResult = await extractInvoiceData(file.data, file.mimetype);

    if (!extractionResult.success) {
      return res.status(500).json({ error: 'Failed to extract invoice data' });
    }

    const invoiceData = extractionResult.data;

    // Auto-categorize if not provided
    if (!invoiceData.category) {
      invoiceData.category = await categorizeInvoice(
        invoiceData.vendor_name,
        invoiceData.line_items
      );
    }

    // Store in database
    const result = await transaction(async (client) => {
      // Insert invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          user_id, vendor_name, invoice_number, invoice_date, due_date,
          total_amount, tax_amount, subtotal, currency, category,
          file_url, file_type, s3_key, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          userId,
          invoiceData.vendor_name,
          invoiceData.invoice_number,
          invoiceData.invoice_date,
          invoiceData.due_date,
          invoiceData.total_amount,
          invoiceData.tax_amount || 0,
          invoiceData.subtotal,
          invoiceData.currency || 'USD',
          invoiceData.category,
          uploadResult.url,
          file.mimetype,
          uploadResult.key,
          JSON.stringify(invoiceData),
        ]
      );

      const invoice = invoiceResult.rows[0];

      // Insert line items
      if (invoiceData.line_items && invoiceData.line_items.length > 0) {
        for (const item of invoiceData.line_items) {
          await client.query(
            `INSERT INTO invoice_items (
              invoice_id, description, quantity, unit_price, total_price, category
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              invoice.id,
              item.description,
              item.quantity || 1,
              item.unit_price,
              item.total_price,
              item.category,
            ]
          );
        }
      }

      return invoice;
    });

    res.status(201).json({
      message: 'Invoice processed successfully',
      invoice: result,
      extractedData: invoiceData,
    });
  } catch (error) {
    console.error('Invoice upload error:', error);
    res.status(500).json({ error: 'Failed to process invoice' });
  }
});

/**
 * GET /api/invoices
 * Get all invoices for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, category, vendor } = req.query;

    let queryText = `
      SELECT 
        i.*,
        json_agg(
          json_build_object(
            'id', ii.id,
            'description', ii.description,
            'quantity', ii.quantity,
            'unit_price', ii.unit_price,
            'total_price', ii.total_price,
            'category', ii.category
          )
        ) FILTER (WHERE ii.id IS NOT NULL) as line_items
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.user_id = $1
    `;
    
    const params = [userId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      queryText += ` AND i.invoice_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      queryText += ` AND i.invoice_date <= $${paramCount}`;
      params.push(endDate);
    }

    if (category) {
      paramCount++;
      queryText += ` AND i.category = $${paramCount}`;
      params.push(category);
    }

    if (vendor) {
      paramCount++;
      queryText += ` AND i.vendor_name ILIKE $${paramCount}`;
      params.push(`%${vendor}%`);
    }

    queryText += ' GROUP BY i.id ORDER BY i.invoice_date DESC';

    const result = await query(queryText, params);

    res.json({
      invoices: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to retrieve invoices' });
  }
});

/**
 * GET /api/invoices/:id
 * Get a specific invoice
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await query(
      `SELECT 
        i.*,
        json_agg(
          json_build_object(
            'id', ii.id,
            'description', ii.description,
            'quantity', ii.quantity,
            'unit_price', ii.unit_price,
            'total_price', ii.total_price,
            'category', ii.category
          )
        ) FILTER (WHERE ii.id IS NOT NULL) as line_items
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.id = $1 AND i.user_id = $2
      GROUP BY i.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Generate presigned URL for file access
    const invoice = result.rows[0];
    if (invoice.s3_key) {
      const urlResult = await getPresignedUrl(invoice.s3_key);
      if (urlResult.success) {
        invoice.file_url = urlResult.url;
      }
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to retrieve invoice' });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete an invoice
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get invoice to find S3 key
    const invoiceResult = await query(
      'SELECT s3_key FROM invoices WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const s3Key = invoiceResult.rows[0].s3_key;

    // Delete from S3
    if (s3Key) {
      await deleteFile(s3Key);
    }

    // Delete from database (cascade will delete items)
    await query('DELETE FROM invoices WHERE id = $1 AND user_id = $2', [id, userId]);

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

/**
 * PUT /api/invoices/:id
 * Update invoice metadata
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { category, status, notes } = req.body;

    const updates = [];
    const params = [id, userId];
    let paramCount = 2;

    if (category) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (notes) {
      paramCount++;
      updates.push(`metadata = metadata || jsonb_build_object('notes', $${paramCount})`);
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const result = await query(
      `UPDATE invoices 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      message: 'Invoice updated successfully',
      invoice: result.rows[0],
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

export default router;
