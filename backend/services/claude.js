import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract invoice data from an image or PDF using Claude Vision
 */
export const extractInvoiceData = async (fileBuffer, fileType) => {
  try {
    // Convert buffer to base64
    const base64Data = fileBuffer.toString('base64');
    
    // Determine media type
    let mediaType = 'image/jpeg';
    if (fileType.includes('png')) mediaType = 'image/png';
    else if (fileType.includes('pdf')) mediaType = 'application/pdf';
    else if (fileType.includes('webp')) mediaType = 'image/webp';
    else if (fileType.includes('gif')) mediaType = 'image/gif';

    const prompt = `You are an expert invoice data extraction system. Analyze this invoice image/document and extract ALL relevant information in a structured JSON format.

Extract the following information:
- vendor_name: The company/vendor name
- invoice_number: Invoice or reference number
- invoice_date: Date of invoice (YYYY-MM-DD format)
- due_date: Payment due date (YYYY-MM-DD format)
- total_amount: Total amount due (number only)
- tax_amount: Tax amount (number only)
- subtotal: Subtotal before tax (number only)
- currency: Currency code (e.g., USD, EUR, GBP)
- line_items: Array of items with description, quantity, unit_price, total_price
- category: Best category for this invoice (Software, Utilities, Office Supplies, Cloud Services, etc.)
- payment_method: If mentioned (Credit Card, Bank Transfer, etc.)
- notes: Any additional important information

Respond ONLY with valid JSON. Do not include any markdown formatting or explanations.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: mediaType === 'application/pdf' ? 'document' : 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].text;
    
    // Remove markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const invoiceData = JSON.parse(cleanedResponse);
    
    return {
      success: true,
      data: invoiceData,
    };
  } catch (error) {
    console.error('Error extracting invoice data:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate AI response for chat queries about invoices
 */
export const generateChatResponse = async (userMessage, invoiceContext, chatHistory = []) => {
  try {
    const systemPrompt = `You are an AI financial assistant helping users understand their invoice data. 

You have access to the following invoice information:
${JSON.stringify(invoiceContext, null, 2)}

Provide clear, concise answers about spending patterns, tax information, vendor analysis, and financial insights.
When mentioning amounts, always include the currency symbol.
Be helpful and friendly, but professional.`;

    // Build conversation history
    const messages = [
      ...chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
    });

    return {
      success: true,
      message: response.content[0].text,
    };
  } catch (error) {
    console.error('Error generating chat response:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Categorize an invoice using AI
 */
export const categorizeInvoice = async (vendorName, items) => {
  try {
    const prompt = `Based on the vendor name "${vendorName}" and items: ${JSON.stringify(items)}, 
    categorize this invoice into ONE of these categories:
    - Software
    - Cloud Services
    - Office Supplies
    - Utilities
    - Marketing
    - Professional Services
    - Hardware
    - Travel
    - Food & Beverages
    - Other
    
    Respond with only the category name, nothing else.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.error('Error categorizing invoice:', error);
    return 'Other';
  }
};

export default {
  extractInvoiceData,
  generateChatResponse,
  categorizeInvoice,
};
