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

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      // Fallback response when API key is not configured
      const fallbackResponses = {
        'default': 'Thank you for your question! As a career guidance assistant, I\'m here to help you with information about career paths, educational opportunities, and skill development. However, my full AI capabilities are currently being configured. Please feel free to ask me about specific careers, entrance exams, or educational pathways!',
        'career': 'There are many exciting career paths available after 12th grade! Some popular options include Engineering, Medicine, Business Administration, Arts, Law, and many others. Each field has its own entrance requirements and preparation strategies. What specific career area interests you?',
        'engineering': 'Engineering is a fantastic career choice with many specializations like Computer Science, Mechanical, Electrical, Civil, and more. Key entrance exams include JEE Main, JEE Advanced, and state-level engineering exams. Would you like to know about a specific engineering branch?',
        'medical': 'Medical careers are highly rewarding and include options like MBBS, BDS, Pharmacy, Nursing, and Allied Health Sciences. The main entrance exam is NEET for undergraduate medical courses. The field requires dedication and strong academic preparation.',
        'exam': 'Entrance exam preparation requires consistent study, practice tests, and good time management. Key tips include: 1) Create a study schedule 2) Focus on basics first 3) Take regular mock tests 4) Identify weak areas 5) Stay consistent with preparation.'
      };
      
      let response = fallbackResponses.default;
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('career') || lowerMessage.includes('job')) {
        response = fallbackResponses.career;
      } else if (lowerMessage.includes('engineering') || lowerMessage.includes('engineer')) {
        response = fallbackResponses.engineering;
      } else if (lowerMessage.includes('medical') || lowerMessage.includes('doctor') || lowerMessage.includes('mbbs')) {
        response = fallbackResponses.medical;
      } else if (lowerMessage.includes('exam') || lowerMessage.includes('preparation') || lowerMessage.includes('study')) {
        response = fallbackResponses.exam;
      }
      
      return res.json({
        response: response,
        timestamp: new Date().toISOString()
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