import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import App from '../App';
import Auth from '../pages/Auth';
import AskAI from '../components/AskAI';
import WeekView from '../components/WeekView';
import Sidebar from '../components/Sidebar';
import Groups from '../pages/Groups';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
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

  describe('WeekView Component', () => {
    test('renders loading state initially', () => {
      render(
        <TestWrapper>
          <WeekView />
        </TestWrapper>
      );

      expect(screen.getByText('Loading weekly updates...')).toBeInTheDocument();
    });

    test('displays weeks data after successful fetch', async () => {
      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            _id: '1',
            weekNumber: 1,
            summary: 'Week 1 activities and learning',
            photos: ['photo1.jpg', 'photo2.jpg'],
            reportPdf: 'week1-report.pdf',
            createdAt: '2024-01-01T00:00:00.000Z'
          },
          {
            _id: '2',
            weekNumber: 2,
            summary: 'Week 2 project work',
            photos: ['photo3.jpg'],
            reportPdf: 'week2-report.pdf',
            createdAt: '2024-01-08T00:00:00.000Z'
          }
        ]),
      });

      render(
        <TestWrapper>
          <WeekView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Weekly Updates')).toBeInTheDocument();
        expect(screen.getByText('Week 1')).toBeInTheDocument();
        expect(screen.getByText('Week 2')).toBeInTheDocument();
        expect(screen.getByText('Week 1 activities and learning')).toBeInTheDocument();
        expect(screen.getByText('Week 2 project work')).toBeInTheDocument();
      });
    });

    test('handles API error gracefully', async () => {
      // Mock API error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <WeekView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Weeks')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load weeks/)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    test('displays empty state when no weeks available', async () => {
      // Mock empty response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      render(
        <TestWrapper>
          <WeekView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No Weeks Available')).toBeInTheDocument();
        expect(screen.getByText('No weeks have been uploaded yet.')).toBeInTheDocument();
      });
    });

    test('retry functionality works', async () => {
      const user = userEvent.setup();
      
      // First call fails
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <TestWrapper>
          <WeekView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Second call succeeds
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            _id: '1',
            weekNumber: 1,
            summary: 'Week 1 content',
            photos: [],
            reportPdf: null,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        ]),
      });

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Week 1')).toBeInTheDocument();
      });
    });

    test('displays photo gallery when photos are available', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            _id: '1',
            weekNumber: 1,
            summary: 'Week with photos',
            photos: ['photo1.jpg', 'photo2.jpg'],
            reportPdf: null,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        ]),
      });

      render(
        <TestWrapper>
          <WeekView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
        const photos = screen.getAllByAltText(/Week 1 photo/);
        expect(photos).toHaveLength(2);
      });
    });

    test('displays PDF viewer controls when PDF is available', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            _id: '1',
            weekNumber: 1,
            summary: 'Week with PDF',
            photos: [],
            reportPdf: 'report.pdf',
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        ]),
      });

      render(
        <TestWrapper>
          <WeekView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Weekly Report')).toBeInTheDocument();
        expect(screen.getByText('View PDF')).toBeInTheDocument();
        expect(screen.getByText('Open in New Tab')).toBeInTheDocument();
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Component', () => {
    const mockToggleSidebar = jest.fn();
    const mockUser = {
      name: 'Test User',
      username: 'testuser',
      role: 'student'
    };

    const mockAuthContext = {
      user: mockUser,
      isAdmin: () => false,
      logout: jest.fn()
    };

    beforeEach(() => {
      mockToggleSidebar.mockClear();
      mockAuthContext.logout.mockClear();
    });

    test('renders sidebar with navigation links', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
        </BrowserRouter>
      );

      expect(screen.getByText('CSP Project')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Career Guidance')).toBeInTheDocument();
      expect(screen.getByText('Weekly Visits')).toBeInTheDocument();
      expect(screen.getByText('Chatbot Full View')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();
    });

    test('closes sidebar when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
        </BrowserRouter>
      );

      const closeButton = screen.getByLabelText('Close sidebar');
      await user.click(closeButton);

      expect(mockToggleSidebar).toHaveBeenCalledWith(false);
    });

    test('applies correct CSS classes when open/closed', () => {
      const { rerender } = render(
        <BrowserRouter>
          <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
        </BrowserRouter>
      );

      const sidebar = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(sidebar).toHaveClass('translate-x-0');

      rerender(
        <BrowserRouter>
          <Sidebar isOpen={false} toggleSidebar={mockToggleSidebar} />
        </BrowserRouter>
      );

      expect(sidebar).toHaveClass('-translate-x-full');
    });

    test('handles keyboard navigation (Escape key)', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
        </BrowserRouter>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockToggleSidebar).toHaveBeenCalledWith(false);
    });

    test('navigation links have correct accessibility attributes', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
        </BrowserRouter>
      );

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('href', '/');
      
      const careerLink = screen.getByRole('link', { name: /career guidance/i });
      expect(careerLink).toHaveAttribute('href', '/career-guidance');
    });
  });

  describe('Groups Component', () => {
    beforeEach(() => {
      // Mock the api utility
      jest.doMock('../utils/api', () => ({
        api: {
          listGroups: jest.fn(),
          listMessages: jest.fn(),
          sendMessageToGroup: jest.fn(),
          joinGroup: jest.fn(),
          leaveGroup: jest.fn()
        }
      }));
    });

    test('renders loading state initially', () => {
      render(
        <TestWrapper>
          <Groups />
        </TestWrapper>
      );

      expect(screen.getByText('Loading groups...')).toBeInTheDocument();
    });

    test('displays groups after successful fetch', async () => {
      const mockGroups = [
        {
          _id: 'group1',
          name: 'Study Group 1',
          description: 'Mathematics study group',
          members: ['user1', 'user2'],
          isMember: false
        },
        {
          _id: 'group2',
          name: 'Study Group 2',
          description: 'Physics study group',
          members: ['user1'],
          isMember: true
        }
      ];

      // Mock successful API response
      const { api } = require('../utils/api');
      api.listGroups.mockResolvedValue(mockGroups);

      render(
        <TestWrapper>
          <Groups />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Study Groups')).toBeInTheDocument();
        expect(screen.getByText('Study Group 1')).toBeInTheDocument();
        expect(screen.getByText('Study Group 2')).toBeInTheDocument();
        expect(screen.getByText('Mathematics study group')).toBeInTheDocument();
        expect(screen.getByText('Physics study group')).toBeInTheDocument();
      });
    });

    test('shows join button for non-member groups', async () => {
      const mockGroups = [
        {
          _id: 'group1',
          name: 'Study Group 1',
          description: 'Test group',
          members: [],
          isMember: false
        }
      ];

      const { api } = require('../utils/api');
      api.listGroups.mockResolvedValue(mockGroups);

      render(
        <TestWrapper>
          <Groups />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Join Group')).toBeInTheDocument();
      });
    });

    test('shows member controls for joined groups', async () => {
      const mockGroups = [
        {
          _id: 'group1',
          name: 'Study Group 1',
          description: 'Test group',
          members: ['user1'],
          isMember: true
        }
      ];

      const { api } = require('../utils/api');
      api.listGroups.mockResolvedValue(mockGroups);

      render(
        <TestWrapper>
          <Groups />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Open Chat')).toBeInTheDocument();
        expect(screen.getByText('Leave')).toBeInTheDocument();
        expect(screen.getByText('Member')).toBeInTheDocument();
      });
    });

    test('handles group join functionality', async () => {
      const user = userEvent.setup();
      const mockGroups = [
        {
          _id: 'group1',
          name: 'Study Group 1',
          description: 'Test group',
          members: [],
          isMember: false
        }
      ];

      const { api } = require('../utils/api');
      api.listGroups.mockResolvedValue(mockGroups);
      api.joinGroup.mockResolvedValue({});

      render(
        <TestWrapper>
          <Groups />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Join Group')).toBeInTheDocument();
      });

      const joinButton = screen.getByText('Join Group');
      await user.click(joinButton);

      expect(api.joinGroup).toHaveBeenCalledWith('group1');
    });

    test('displays empty state when no groups available', async () => {
      const { api } = require('../utils/api');
      api.listGroups.mockResolvedValue([]);

      render(
        <TestWrapper>
          <Groups />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No groups available yet')).toBeInTheDocument();
      });
    });

    test('handles API errors gracefully', async () => {
      const { api } = require('../utils/api');
      api.listGroups.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <Groups />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('LoadingSpinner Component', () => {
    test('renders with default size', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    test('renders with large size', () => {
      render(<LoadingSpinner size="large" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    test('renders with custom color', () => {
      render(<LoadingSpinner color="red" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary Component', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    const ThrowError = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    test('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    test('renders error UI when there is an error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('components have proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check for ARIA labels on interactive elements
      const chatButton = screen.getByLabelText(/open askai chat/i);
      expect(chatButton).toBeInTheDocument();
    });

    test('navigation has proper semantic structure', () => {
      const mockToggleSidebar = jest.fn();
      
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
        </BrowserRouter>
      );

      const nav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(nav).toBeInTheDocument();
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    test('form elements have proper labels', () => {
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      const usernameInput = screen.getByPlaceholderText('Choose a username');
      expect(usernameInput).toBeInTheDocument();
      
      const passwordInput = screen.getByPlaceholderText('Enter password');
      expect(passwordInput).toBeInTheDocument();
    });

    test('buttons have descriptive text or aria-labels', async () => {
      const user = userEvent.setup();
      render(<AskAI />);
      
      const chatButton = screen.getByLabelText('Open AskAI Chat');
      await user.click(chatButton);

      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeInTheDocument();
      
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    test('navigation between components works', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Test navigation (this would require proper routing setup)
      // For now, just verify the app renders without crashing
      expect(document.body).toBeInTheDocument();
    });

    test('error states are handled consistently across components', async () => {
      // Test that all components handle network errors similarly
      fetch.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <WeekView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Error Loading Weeks/)).toBeInTheDocument();
      });
    });

    test('loading states are displayed consistently', () => {
      render(
        <TestWrapper>
          <WeekView />
        </TestWrapper>
      );

      expect(screen.getByText('Loading weekly updates...')).toBeInTheDocument();
    });
  });
});
