import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Groups from '../../pages/Groups';

// Mock the api utility
const mockApi = {
  listGroups: jest.fn(),
  listMessages: jest.fn(),
  sendMessageToGroup: jest.fn(),
  joinGroup: jest.fn(),
  leaveGroup: jest.fn()
};

jest.mock('../../utils/api', () => ({
  api: mockApi
}));

// Mock child components
jest.mock('../../components/LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('../../components/ErrorBoundary', () => {
  return function ErrorBoundary({ children }) {
    return <div data-testid="error-boundary">{children}</div>;
  };
});

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Groups Component', () => {
  beforeEach(() => {
    Object.values(mockApi).forEach(mock => mock.mockClear());
  });

  test('renders loading state initially', () => {
    // Mock pending promise
    mockApi.listGroups.mockReturnValue(new Promise(() => {}));
    
    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    expect(screen.getByText('Loading groups...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('displays groups after successful fetch', async () => {
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Mathematics Study Group',
        description: 'Group for mathematics discussions',
        members: ['user1', 'user2'],
        isMember: false
      },
      {
        _id: 'group2',
        name: 'Physics Study Group',
        description: 'Group for physics discussions',
        members: ['user1'],
        isMember: true
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Study Groups')).toBeInTheDocument();
      expect(screen.getByText('Mathematics Study Group')).toBeInTheDocument();
      expect(screen.getByText('Physics Study Group')).toBeInTheDocument();
      expect(screen.getByText('Group for mathematics discussions')).toBeInTheDocument();
      expect(screen.getByText('Group for physics discussions')).toBeInTheDocument();
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

    mockApi.listGroups.mockResolvedValue(mockGroups);

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

    mockApi.listGroups.mockResolvedValue(mockGroups);

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

    mockApi.listGroups.mockResolvedValue(mockGroups);
    mockApi.joinGroup.mockResolvedValue({});

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

    expect(mockApi.joinGroup).toHaveBeenCalledWith('group1');
  });

  test('handles group leave functionality', async () => {
    const user = userEvent.setup();
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Study Group 1',
        description: 'Test group',
        members: ['user1'],
        isMember: true
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);
    mockApi.leaveGroup.mockResolvedValue({});

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Leave')).toBeInTheDocument();
    });

    const leaveButton = screen.getByText('Leave');
    await user.click(leaveButton);

    expect(mockApi.leaveGroup).toHaveBeenCalledWith('group1');
  });

  test('opens group chat when Open Chat is clicked', async () => {
    const user = userEvent.setup();
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Study Group 1',
        description: 'Test group',
        members: ['user1'],
        isMember: true
      }
    ];

    const mockMessages = [
      {
        _id: 'msg1',
        content: 'Hello everyone!',
        userId: { name: 'John Doe' },
        createdAt: '2024-01-01T10:00:00.000Z'
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);
    mockApi.listMessages.mockResolvedValue(mockMessages);

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Open Chat')).toBeInTheDocument();
    });

    const openChatButton = screen.getByText('Open Chat');
    await user.click(openChatButton);

    await waitFor(() => {
      expect(screen.getByText('Study Group 1')).toBeInTheDocument();
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(mockApi.listMessages).toHaveBeenCalledWith('group1');
  });

  test('prevents opening chat for non-member groups', async () => {
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

    mockApi.listGroups.mockResolvedValue(mockGroups);

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    // Should not have Open Chat button for non-members
    await waitFor(() => {
      expect(screen.queryByText('Open Chat')).not.toBeInTheDocument();
      expect(screen.getByText('Join Group')).toBeInTheDocument();
    });
  });

  test('sends message functionality', async () => {
    const user = userEvent.setup();
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Study Group 1',
        description: 'Test group',
        members: ['user1'],
        isMember: true
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);
    mockApi.listMessages.mockResolvedValue([]);
    mockApi.sendMessageToGroup.mockResolvedValue({
      _id: 'newmsg',
      content: 'Test message',
      userId: { name: 'Current User' },
      createdAt: new Date().toISOString()
    });

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    // Open chat
    await waitFor(() => {
      expect(screen.getByText('Open Chat')).toBeInTheDocument();
    });

    const openChatButton = screen.getByText('Open Chat');
    await user.click(openChatButton);

    // Wait for chat to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    // Type and send message
    const messageInput = screen.getByPlaceholderText('Type your message...');
    await user.type(messageInput, 'Test message');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    expect(mockApi.sendMessageToGroup).toHaveBeenCalledWith('group1', 'Test message');
  });

  test('handles message sending with Enter key', async () => {
    const user = userEvent.setup();
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Study Group 1',
        description: 'Test group',
        members: ['user1'],
        isMember: true
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);
    mockApi.listMessages.mockResolvedValue([]);
    mockApi.sendMessageToGroup.mockResolvedValue({
      _id: 'newmsg',
      content: 'Test message',
      userId: { name: 'Current User' },
      createdAt: new Date().toISOString()
    });

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    // Open chat
    await waitFor(() => {
      expect(screen.getByText('Open Chat')).toBeInTheDocument();
    });

    const openChatButton = screen.getByText('Open Chat');
    await user.click(openChatButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    // Type message and press Enter
    const messageInput = screen.getByPlaceholderText('Type your message...');
    await user.type(messageInput, 'Test message{enter}');

    expect(mockApi.sendMessageToGroup).toHaveBeenCalledWith('group1', 'Test message');
  });

  test('displays empty state when no groups available', async () => {
    mockApi.listGroups.mockResolvedValue([]);

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No groups available yet')).toBeInTheDocument();
    });
  });

  test('displays empty chat state when no messages', async () => {
    const user = userEvent.setup();
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Study Group 1',
        description: 'Test group',
        members: ['user1'],
        isMember: true
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);
    mockApi.listMessages.mockResolvedValue([]);

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Open Chat')).toBeInTheDocument();
    });

    const openChatButton = screen.getByText('Open Chat');
    await user.click(openChatButton);

    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to start the conversation!')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockApi.listGroups.mockRejectedValue(new Error('Network error'));

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

  test('handles message sending errors', async () => {
    const user = userEvent.setup();
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Study Group 1',
        description: 'Test group',
        members: ['user1'],
        isMember: true
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);
    mockApi.listMessages.mockResolvedValue([]);
    mockApi.sendMessageToGroup.mockRejectedValue(new Error('Failed to send message'));

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    // Open chat
    await waitFor(() => {
      expect(screen.getByText('Open Chat')).toBeInTheDocument();
    });

    const openChatButton = screen.getByText('Open Chat');
    await user.click(openChatButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    // Try to send message
    const messageInput = screen.getByPlaceholderText('Type your message...');
    await user.type(messageInput, 'Test message');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to send message/)).toBeInTheDocument();
    });

    // Message should be restored in input field
    expect(messageInput.value).toBe('Test message');
  });

  test('displays member count correctly', async () => {
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Study Group 1',
        description: 'Test group',
        members: ['user1', 'user2', 'user3'],
        isMember: false
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('3 members')).toBeInTheDocument();
    });
  });

  test('refresh groups functionality', async () => {
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

    mockApi.listGroups.mockResolvedValue(mockGroups);

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Refresh groups')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle('Refresh groups');
    await user.click(refreshButton);

    expect(mockApi.listGroups).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  test('message character limit display', async () => {
    const user = userEvent.setup();
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Study Group 1',
        description: 'Test group',
        members: ['user1'],
        isMember: true
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);
    mockApi.listMessages.mockResolvedValue([]);

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    // Open chat
    await waitFor(() => {
      expect(screen.getByText('Open Chat')).toBeInTheDocument();
    });

    const openChatButton = screen.getByText('Open Chat');
    await user.click(openChatButton);

    await waitFor(() => {
      expect(screen.getByText('0/500')).toBeInTheDocument();
    });

    // Type some text
    const messageInput = screen.getByPlaceholderText('Type your message...');
    await user.type(messageInput, 'Hello');

    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  test('consecutive messages from same user are grouped', async () => {
    const user = userEvent.setup();
    const mockGroups = [
      {
        _id: 'group1',
        name: 'Study Group 1',
        description: 'Test group',
        members: ['user1'],
        isMember: true
      }
    ];

    const mockMessages = [
      {
        _id: 'msg1',
        content: 'First message',
        userId: { name: 'John Doe' },
        createdAt: '2024-01-01T10:00:00.000Z'
      },
      {
        _id: 'msg2',
        content: 'Second message',
        userId: { name: 'John Doe' },
        createdAt: '2024-01-01T10:01:00.000Z'
      }
    ];

    mockApi.listGroups.mockResolvedValue(mockGroups);
    mockApi.listMessages.mockResolvedValue(mockMessages);

    render(
      <TestWrapper>
        <Groups />
      </TestWrapper>
    );

    // Open chat
    await waitFor(() => {
      expect(screen.getByText('Open Chat')).toBeInTheDocument();
    });

    const openChatButton = screen.getByText('Open Chat');
    await user.click(openChatButton);

    await waitFor(() => {
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      
      // Should only show one instance of the user name for consecutive messages
      const userNames = screen.getAllByText('John Doe');
      expect(userNames).toHaveLength(1);
    });
  });
});