const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // Ensure fetch is available in Node

// POST AI chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        message: 'AI service not configured. Please set GEMINI_API_KEY in environment variables.' 
      });
    }

    const systemPrompt = `You are a career guidance chatbot. Your purpose is to provide helpful and accurate information about careers, education paths, and skills development. Do not answer questions that are not related to career guidance. If a user asks a question that is not related to career guidance, politely decline to answer and remind them of your purpose.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: message },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch response from Gemini API');
    }

    const data = await response.json();
    const aiResponse = {
      response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response right now.',
      timestamp: new Date().toISOString()
    };

    res.json(aiResponse);

  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ 
      message: 'AI service error', 
      error: error.message 
    });
  }
});

module.exports = router;