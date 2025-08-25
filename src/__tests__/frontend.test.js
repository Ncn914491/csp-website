import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import App from '../App';
import Auth from '../pages/Auth';
import AskAI from '../components/AskAI';
import { AuthProvider } from '../contexts/AuthContext';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Frontend Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  describe('App Component', () => {
    test('renders homepage without crashing', () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check if the main content is rendered
      expect(document.body).toBeInTheDocument();
    });

    test('renders AskAI chatbot button', () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Look for the AskAI chat button
      const chatButton = screen.getByLabelText(/open askai chat/i);
      expect(chatButton).toBeInTheDocument();
    });
  });

  describe('Auth Component - Login/Signup Forms', () => {
    test('renders student signup form by default', () => {
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      expect(screen.getByText('Career Guidance Portal')).toBeInTheDocument();
      expect(screen.getByText('Create Student Account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
    });

    test('switches to student login when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Student Sign In');
      await user.click(loginButton);

      expect(screen.getByText('Student Login')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Confirm password')).not.toBeInTheDocument();
    });

    test('switches to admin login when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      const adminButton = screen.getByText('Admin Sign In');
      await user.click(adminButton);

      expect(screen.getByText('Admin Access')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Admin username')).toBeInTheDocument();
    });

    test('handles successful signup', async () => {
      const user = userEvent.setup();
      
      // Mock successful signup response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: 'User registered successfully',
          token: 'mock-token',
          user: { id: '1', role: 'student' }
        }),
      });

      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      // Fill out the signup form
      await user.type(screen.getByPlaceholderText('Choose a username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter password'), 'password123');
      await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
      
      const submitButton = screen.getByText('Sign Up');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('shows error for mismatched passwords', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      await user.type(screen.getByPlaceholderText('Choose a username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter password'), 'password123');
      await user.type(screen.getByPlaceholderText('Confirm password'), 'differentpassword');
      
      const submitButton = screen.getByText('Sign Up');
      await user.click(submitButton);

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    test('handles login failure', async () => {
      const user = userEvent.setup();
      
      // Mock login failure response
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Invalid credentials'
        }),
      });

      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      // Switch to login mode
      await user.click(screen.getByText('Student Sign In'));

      await user.type(screen.getByPlaceholderText('Choose a username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter password'), 'wrongpassword');
      
      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Weekly Reports Data Rendering', () => {
    test('renders weekly reports from mocked API', async () => {
      // Mock API response for weekly reports
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            _id: '1',
            weekNumber: 1,
            activities: 'Test activities for week 1',
            highlights: 'Test highlights for week 1',
            gallery: ['image1.jpg', 'image2.jpg'],
            report: 'week1-report.pdf'
          },
          {
            _id: '2', 
            weekNumber: 2,
            activities: 'Test activities for week 2',
            highlights: 'Test highlights for week 2',
            gallery: ['image3.jpg'],
            report: 'week2-report.pdf'
          }
        ]),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for the data to be loaded and rendered
      await waitFor(() => {
        // Check if weekly reports are rendered (assuming they appear on homepage)
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/weeks')
        );
      });
    });
  });

  describe('AskAI Chatbot Component', () => {
    test('renders chat button initially', () => {
      render(<AskAI />);
      
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toHaveClass('fixed', 'bottom-6', 'right-6');
    });

    test('opens chat window when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AskAI />);
      
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      expect(screen.getByText('AskAI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Your Career Guidance Helper')).toBeInTheDocument();
      expect(screen.getByText(/Hello! I'm AskAI/)).toBeInTheDocument();
    });

    test('displays initial greeting message', async () => {
      const user = userEvent.setup();
      render(<AskAI />);
      
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      const greetingMessage = screen.getByText(/Hello! I'm AskAI, your career guidance assistant/);
      expect(greetingMessage).toBeInTheDocument();
    });

    test('accepts user input and displays it', async () => {
      const user = userEvent.setup();
      render(<AskAI />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      // Type message
      const inputField = screen.getByPlaceholderText('Type your question...');
      await user.type(inputField, 'What are the best engineering colleges?');
      
      expect(inputField.value).toBe('What are the best engineering colleges?');
    });

    test('sends message and displays mocked Gemini response', async () => {
      const user = userEvent.setup();
      
      // Mock API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Here are some top engineering colleges: IIT Delhi, IIT Bombay, IIT Madras...'
        }),
      });

      render(<AskAI />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      // Type and send message
      const inputField = screen.getByPlaceholderText('Type your question...');
      await user.type(inputField, 'What are the best engineering colleges?');
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);

      // Check if user message appears
      await waitFor(() => {
        expect(screen.getByText('What are the best engineering colleges?')).toBeInTheDocument();
      });

      // Check if AI response appears
      await waitFor(() => {
        expect(screen.getByText(/Here are some top engineering colleges/)).toBeInTheDocument();
      });

      // Verify API was called
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'What are the best engineering colleges?' }),
      });
    });

    test('displays quick question buttons', async () => {
      const user = userEvent.setup();
      render(<AskAI />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      // Check for quick questions
      expect(screen.getByText('Quick questions:')).toBeInTheDocument();
      
      const quickQuestionButtons = screen.getAllByText(/.*career paths.*|.*entrance exams.*|.*medical studies.*|.*scholarship.*/);
      expect(quickQuestionButtons.length).toBeGreaterThan(0);
    });

    test('clicking quick question populates input field', async () => {
      const user = userEvent.setup();
      render(<AskAI />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      // Click on a quick question button
      const quickQuestion = screen.getByText(/What career paths are available.../);
      await user.click(quickQuestion);

      const inputField = screen.getByPlaceholderText('Type your question...');
      expect(inputField.value).toBe('What career paths are available after 12th?');
    });

    test('can minimize and maximize chat window', async () => {
      const user = userEvent.setup();
      render(<AskAI />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      // Minimize chat
      const minimizeButton = screen.getByLabelText('Minimize');
      await user.click(minimizeButton);

      // Check if chat is minimized (input area should not be visible)
      expect(screen.queryByPlaceholderText('Type your question...')).not.toBeInTheDocument();

      // Maximize chat
      const maximizeButton = screen.getByLabelText('Maximize');
      await user.click(maximizeButton);

      // Check if chat is maximized again
      expect(screen.getByPlaceholderText('Type your question...')).toBeInTheDocument();
    });

    test('can close chat window', async () => {
      const user = userEvent.setup();
      render(<AskAI />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      expect(screen.getByText('AskAI Assistant')).toBeInTheDocument();

      // Close chat
      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      // Chat window should be closed, button should be visible again
      expect(screen.queryByText('AskAI Assistant')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Open AskAI Chat')).toBeInTheDocument();
    });

    test('handles API error gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AskAI />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      // Send message
      const inputField = screen.getByPlaceholderText('Type your question...');
      await user.type(inputField, 'Test question');
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/couldn't connect to the server/)).toBeInTheDocument();
      });
    });
  });
});
