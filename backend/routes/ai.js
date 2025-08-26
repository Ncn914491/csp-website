const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const fetch = require('node-fetch');

// In-memory conversation context storage (in production, use Redis or database)
const conversationContexts = new Map();

// Helper function to clean old conversation contexts (prevent memory leaks)
const cleanOldContexts = () => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, context] of conversationContexts.entries()) {
    if (now - context.lastActivity > maxAge) {
      conversationContexts.delete(sessionId);
    }
  }
};

// Clean old contexts every 10 minutes
setInterval(cleanOldContexts, 10 * 60 * 1000);

// Health check endpoint for AI service
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      service: "AI Chatbot API",
      timestamp: new Date().toISOString(),
      geminiApiKey: process.env.GEMINI_API_KEY ? "configured" : "not_configured",
      activeContexts: conversationContexts.size
    };

    // Test Gemini API connectivity if key is configured
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const testResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Hello" }] }]
            }),
            timeout: 5000
          }
        );
        
        healthStatus.geminiApiStatus = testResponse.ok ? "connected" : "error";
      } catch (apiError) {
        healthStatus.geminiApiStatus = "unreachable";
        healthStatus.geminiApiError = apiError.message;
      }
    } else {
      healthStatus.geminiApiStatus = "not_configured";
    }

    const status = healthStatus.geminiApiStatus === "connected" ? 200 : 503;
    res.status(status).json(healthStatus);
  } catch (err) {
    res.status(500).json({
      service: "AI Chatbot API",
      status: "error",
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced AI chat endpoint with conversation context
router.post('/', async (req, res) => {
  try {
    const { message, sessionId, context } = req.body;

    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "Message is required and cannot be empty"
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "Message cannot exceed 2000 characters"
      });
    }

    const userMessage = message.trim();
    const userSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle case when Gemini API is not configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return handleFallbackResponse(userMessage, userSessionId, res);
    }

    // Get or create conversation context
    let conversationContext = conversationContexts.get(userSessionId) || {
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    // Update last activity
    conversationContext.lastActivity = Date.now();

    // Add user message to context
    conversationContext.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    });

    // Keep only last 10 messages to prevent context from growing too large
    if (conversationContext.messages.length > 10) {
      conversationContext.messages = conversationContext.messages.slice(-10);
    }

    // Prepare conversation history for Gemini
    const conversationHistory = conversationContext.messages
      .slice(-6) // Use last 6 messages for context
      .map(msg => ({
        parts: [{ text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}` }]
      }));

    // Enhanced system prompt with context awareness
    const systemPrompt = `You are a knowledgeable career guidance chatbot for Computer Science Program (CSP) students. Your role is to provide helpful, accurate, and contextual information about:

1. Career paths in technology and computer science
2. Educational opportunities and requirements
3. Skill development and learning resources
4. Entrance exams and preparation strategies
5. Industry trends and job market insights
6. Professional development advice

Guidelines:
- Provide specific, actionable advice
- Consider the conversation history for context
- If asked about non-career topics, politely redirect to career guidance
- Be encouraging and supportive
- Provide concrete examples and resources when possible
- Keep responses concise but informative (under 500 words)

Current conversation context: The user is engaging in an ongoing conversation about career guidance.`;

    try {
      // Create a more focused prompt for better responses
      const contextualPrompt = `${systemPrompt}

Previous conversation:
${conversationHistory.map(msg => msg.parts[0].text).join('\n')}

User's current question: ${userMessage}

Please provide a helpful, specific response about career guidance, education, or professional development. Keep it conversational and under 300 words.`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: contextualPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 512,
              candidateCount: 1
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API Error:', errorText);
        
        // Handle specific API errors
        if (geminiResponse.status === 429) {
          return res.status(429).json({
            error: "Rate limit exceeded",
            message: "Too many requests. Please wait a moment before trying again.",
            retryAfter: 60
          });
        }
        
        if (geminiResponse.status === 403) {
          return res.status(503).json({
            error: "API access denied",
            message: "AI service is currently unavailable. Please try again later."
          });
        }
        
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }

      const data = await geminiResponse.json();
      
      // Extract and validate response with better error handling
      let aiText = '';
      
      if (data?.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        // Check if response was blocked by safety filters
        if (candidate.finishReason === 'SAFETY') {
          aiText = "I understand you're looking for career guidance. Let me help you with information about educational paths, career opportunities, or skill development. What specific area would you like to explore?";
        } else if (candidate.content?.parts && candidate.content.parts.length > 0) {
          aiText = candidate.content.parts.map(p => p.text).join('\n').trim();
        }
      }
      
      if (!aiText) {
        // Fallback to contextual response if Gemini doesn't provide content
        return handleFallbackResponse(userMessage, userSessionId, res, conversationContext);
      }

      // Add AI response to conversation context
      conversationContext.messages.push({
        role: 'assistant',
        content: aiText,
        timestamp: new Date().toISOString()
      });

      // Store updated context
      conversationContexts.set(userSessionId, conversationContext);

      const response = {
        success: true,
        response: aiText,
        sessionId: userSessionId,
        timestamp: new Date().toISOString(),
        contextLength: conversationContext.messages.length
      };

      res.json(response);

    } catch (apiError) {
      console.error('Gemini API Error:', apiError);
      
      // Fallback to contextual response on API failure
      return handleFallbackResponse(userMessage, userSessionId, res, conversationContext);
    }

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      error: "AI service error",
      message: "An unexpected error occurred while processing your request",
      timestamp: new Date().toISOString()
    });
  }
});

// Clear conversation context endpoint
router.delete('/context/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Session ID is required"
      });
    }

    const existed = conversationContexts.has(sessionId);
    conversationContexts.delete(sessionId);

    res.json({
      success: true,
      message: existed ? "Conversation context cleared" : "No context found for session",
      sessionId
    });
  } catch (error) {
    console.error('Clear context error:', error);
    res.status(500).json({
      error: "Failed to clear context",
      message: error.message
    });
  }
});

// Get conversation context endpoint
router.get('/context/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Session ID is required"
      });
    }

    const context = conversationContexts.get(sessionId);
    
    if (!context) {
      return res.status(404).json({
        error: "Context not found",
        message: "No conversation context found for this session"
      });
    }

    res.json({
      success: true,
      sessionId,
      messageCount: context.messages.length,
      createdAt: new Date(context.createdAt).toISOString(),
      lastActivity: new Date(context.lastActivity).toISOString(),
      messages: context.messages
    });
  } catch (error) {
    console.error('Get context error:', error);
    res.status(500).json({
      error: "Failed to get context",
      message: error.message
    });
  }
});

// Enhanced fallback response handler with better contextual responses
function handleFallbackResponse(message, sessionId, res, context = null) {
  const lowerMessage = message.toLowerCase();
  
  // More sophisticated response mapping
  const responseMap = {
    // Career-related queries
    career: {
      keywords: ['career', 'job', 'profession', 'work', 'future'],
      response: 'There are many exciting career paths available! Popular fields include Technology (Software Development, Data Science, AI), Healthcare (Medicine, Nursing, Pharmacy), Engineering (Computer Science, Mechanical, Civil), Business (Management, Finance, Marketing), and Creative fields (Design, Media, Arts). Each has unique requirements and growth opportunities. What specific field interests you most?'
    },
    
    // Engineering queries
    engineering: {
      keywords: ['engineering', 'engineer', 'technical', 'jee', 'iit'],
      response: 'Engineering offers diverse specializations: Computer Science & IT (highest demand), Mechanical (manufacturing, automotive), Electrical (power systems, electronics), Civil (construction, infrastructure), Chemical (process industries), and newer fields like AI/ML, Robotics, and Biomedical Engineering. Key entrance exams include JEE Main, JEE Advanced, and state-level exams. Which engineering branch interests you?'
    },
    
    // Medical queries
    medical: {
      keywords: ['medical', 'doctor', 'mbbs', 'medicine', 'neet', 'health'],
      response: 'Medical careers are highly rewarding with options like MBBS (general medicine), BDS (dentistry), BAMS (Ayurveda), BHMS (Homeopathy), Pharmacy, Nursing, Physiotherapy, and Allied Health Sciences. NEET is the primary entrance exam for undergraduate medical courses. The field requires dedication, strong academics, and genuine interest in helping others. Are you interested in a specific medical field?'
    },
    
    // Programming/Tech queries
    programming: {
      keywords: ['programming', 'coding', 'software', 'development', 'computer', 'tech'],
      response: 'Programming is essential in today\'s digital world! Start with Python (beginner-friendly), then explore Java, JavaScript, C++, or specialized languages. Key areas include Web Development (Frontend/Backend), Mobile App Development, Data Science, AI/ML, and Cybersecurity. Practice on platforms like LeetCode, HackerRank, and GitHub. Build projects to showcase your skills. What type of programming interests you most?'
    },
    
    // Exam preparation
    exam: {
      keywords: ['exam', 'preparation', 'study', 'test', 'entrance'],
      response: 'Effective exam preparation strategies: 1) Create a structured study schedule 2) Understand the syllabus and exam pattern 3) Use quality study materials 4) Take regular mock tests 5) Focus on weak areas 6) Maintain consistency 7) Stay healthy and manage stress. For specific exams like JEE, NEET, or others, targeted preparation with coaching or online resources helps. Which exam are you preparing for?'
    },
    
    // Internship/Experience
    internship: {
      keywords: ['internship', 'experience', 'training', 'placement', 'company'],
      response: 'Internships provide valuable real-world experience! Look for opportunities at tech companies, startups, research institutions, hospitals, or NGOs based on your field. Prepare a strong resume, develop relevant skills, and use platforms like LinkedIn, Internshala, and company websites. Consider both paid and unpaid opportunities for learning. Remote internships have also become popular. What field are you looking for internships in?'
    },
    
    // Skills development
    skills: {
      keywords: ['skill', 'learn', 'course', 'certification', 'training'],
      response: 'Key skills for career success include: Technical skills (specific to your field), Communication skills, Problem-solving, Leadership, Digital literacy, and Continuous learning mindset. Online platforms like Coursera, edX, Udemy, and Khan Academy offer excellent courses. Professional certifications from Google, Microsoft, AWS, and others add value. What specific skills would you like to develop?'
    }
  };
  
  // Find the best matching response
  let bestMatch = null;
  let maxMatches = 0;
  
  for (const [category, data] of Object.entries(responseMap)) {
    const matches = data.keywords.filter(keyword => lowerMessage.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = data.response;
    }
  }
  
  // Default response if no specific match
  let response = bestMatch || 'I\'m here to help with career guidance, educational planning, and professional development. You can ask me about career paths, entrance exams, skill development, internships, or specific fields like engineering, medicine, technology, and more. What would you like to know about?';
  
  // Add contextual awareness
  if (context && context.messages.length > 1) {
    const recentTopics = context.messages
      .filter(msg => msg.role === 'user')
      .slice(-2)
      .map(msg => msg.content.toLowerCase());
    
    const commonKeywords = ['engineering', 'medical', 'programming', 'career', 'exam'];
    const discussedTopics = commonKeywords.filter(keyword => 
      recentTopics.some(topic => topic.includes(keyword))
    );
    
    if (discussedTopics.length > 0) {
      response += `\n\nI see we've been discussing ${discussedTopics.join(', ')}. Feel free to ask more specific questions about these topics!`;
    }
  }
  
  // Store the response in context
  if (context) {
    context.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });
    conversationContexts.set(sessionId, context);
  }
  
  return res.json({
    success: true,
    response: response,
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
    fallbackMode: true,
    reason: "Using enhanced contextual responses"
  });
}

module.exports = router;