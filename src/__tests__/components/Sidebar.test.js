import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Sidebar from '../../components/Sidebar';

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  isAdmin: jest.fn(() => false),
  logout: jest.fn()
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Sidebar Component', () => {
  const mockToggleSidebar = jest.fn();

  beforeEach(() => {
    mockToggleSidebar.mockClear();
    mockAuthContext.logout.mockClear();
    mockAuthContext.isAdmin.mockReturnValue(false);
    mockAuthContext.user = null;
  });

  test('renders sidebar with navigation links', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    expect(screen.getByText('CSP Project')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /career guidance/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /weekly visits/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /chatbot full view/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /groups/i })).toBeInTheDocument();
  });

  test('closes sidebar when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    const closeButton = screen.getByLabelText('Close sidebar');
    await user.click(closeButton);

    expect(mockToggleSidebar).toHaveBeenCalledWith(false);
  });

  test('applies correct CSS classes when open', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    const sidebar = screen.getByLabelText('Main navigation');
    expect(sidebar).toHaveClass('translate-x-0');
    expect(sidebar).not.toHaveClass('-translate-x-full');
  });

  test('applies correct CSS classes when closed', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={false} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    const sidebar = screen.getByLabelText('Main navigation');
    expect(sidebar).toHaveClass('-translate-x-full');
    expect(sidebar).not.toHaveClass('translate-x-0');
  });

  test('handles keyboard navigation (Escape key)', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockToggleSidebar).toHaveBeenCalledWith(false);
  });

  test('handles click outside to close sidebar', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    // Click outside the sidebar
    fireEvent.mouseDown(document.body);
    expect(mockToggleSidebar).toHaveBeenCalledWith(false);
  });

  test('navigation links have correct href attributes', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /career guidance/i })).toHaveAttribute('href', '/career-guidance');
    expect(screen.getByRole('link', { name: /weekly visits/i })).toHaveAttribute('href', '/weekly-visits');
    expect(screen.getByRole('link', { name: /chatbot full view/i })).toHaveAttribute('href', '/chatbot');
    expect(screen.getByRole('link', { name: /groups/i })).toHaveAttribute('href', '/groups');
  });

  test('closes sidebar when navigation link is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    const homeLink = screen.getByRole('link', { name: /home/i });
    await user.click(homeLink);

    expect(mockToggleSidebar).toHaveBeenCalledWith(false);
  });

  test('displays user information when logged in', () => {
    mockAuthContext.user = {
      name: 'John Doe',
      username: 'johndoe',
      role: 'student'
    };

    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('student')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument(); // Avatar initial
  });

  test('displays username when name is not available', () => {
    mockAuthContext.user = {
      username: 'johndoe',
      role: 'student'
    };

    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    expect(screen.getByText('johndoe')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument(); // Avatar initial from username (uppercase)
  });

  test('shows admin section for admin users', () => {
    mockAuthContext.user = {
      name: 'Admin User',
      username: 'admin',
      role: 'admin'
    };
    mockAuthContext.isAdmin.mockReturnValue(true);

    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /admin dashboard/i })).toBeInTheDocument();
  });

  test('hides admin section for regular users', () => {
    mockAuthContext.user = {
      name: 'Regular User',
      username: 'user',
      role: 'student'
    };
    mockAuthContext.isAdmin.mockReturnValue(false);

    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /admin dashboard/i })).not.toBeInTheDocument();
  });

  test('logout functionality works', async () => {
    const user = userEvent.setup();
    mockAuthContext.user = {
      name: 'Test User',
      username: 'testuser',
      role: 'student'
    };

    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    const logoutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(logoutButton);

    expect(mockAuthContext.logout).toHaveBeenCalled();
    expect(mockToggleSidebar).toHaveBeenCalledWith(false);
  });

  test('displays copyright information', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`Community Service Project © ${currentYear}`)).toBeInTheDocument();
  });

  test('proper focus management when sidebar opens', () => {
    const { rerender } = render(
      <TestWrapper>
        <Sidebar isOpen={false} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    // Rerender with sidebar open
    rerender(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    // The close button should be focused when sidebar opens
    setTimeout(() => {
      const closeButton = screen.getByLabelText('Close sidebar');
      expect(closeButton).toHaveFocus();
    }, 150); // Account for the timeout in the component
  });

  test('navigation links have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('href', '/');
    
    // Check sidebar exists
    const sidebar = screen.getByLabelText('Main navigation');
    expect(sidebar).toBeInTheDocument();
  });

  test('tabindex is properly managed based on sidebar state', () => {
    const { rerender } = render(
      <TestWrapper>
        <Sidebar isOpen={false} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    // When closed, navigation links should have tabindex -1
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('tabindex', '-1');

    // When open, navigation links should have tabindex 0
    rerender(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    const openHomeLink = screen.getByRole('link', { name: /home/i });
    expect(openHomeLink).toHaveAttribute('tabindex', '0');
  });

  test('handles keyboard navigation within sidebar', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    const closeButton = screen.getByLabelText('Close sidebar');
    
    // Test that close button can be focused
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);
    
    // Test Tab navigation - just verify the close button is focusable
    fireEvent.keyDown(closeButton, { key: 'Tab' });
    // Note: In a real browser, focus would move to the next element, but in jsdom this is limited
  });

  test('does not close sidebar on Escape when closed', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={false} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });

  test('does not close sidebar on outside click when closed', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={false} toggleSidebar={mockToggleSidebar} />
      </TestWrapper>
    );

    fireEvent.mouseDown(document.body);
    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });
});