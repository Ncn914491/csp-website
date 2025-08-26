import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import WeekView from '../../components/WeekView';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn()
}));

// Mock child components
jest.mock('../../components/LoadingSpinner', () => {
  return function LoadingSpinner({ size }) {
    return <div data-testid="loading-spinner" className={`spinner-${size}`}>Loading...</div>;
  };
});

jest.mock('../../components/ErrorBoundary', () => {
  return function ErrorBoundary({ children }) {
    return <div data-testid="error-boundary">{children}</div>;
  };
});

jest.mock('../../components/PdfViewer', () => {
  return function PdfViewer({ src }) {
    return <div data-testid="pdf-viewer">PDF Viewer: {src}</div>;
  };
});

const axios = require('axios');

describe('WeekView Component', () => {
  beforeEach(() => {
    axios.get.mockClear();
  });

  test('renders loading state initially', () => {
    // Mock pending promise
    axios.get.mockReturnValue(new Promise(() => {}));
    
    render(<WeekView />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading weekly updates...')).toBeInTheDocument();
  });

  test('displays weeks data after successful fetch', async () => {
    const mockWeeksData = [
      {
        _id: '1',
        weekNumber: 1,
        summary: 'Week 1: Introduction to Programming',
        photos: ['photo1.jpg', 'photo2.jpg'],
        reportPdf: 'week1-report.pdf',
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        _id: '2',
        weekNumber: 2,
        summary: 'Week 2: Data Structures',
        photos: ['photo3.jpg'],
        reportPdf: 'week2-report.pdf',
        createdAt: '2024-01-08T00:00:00.000Z'
      }
    ];

    axios.get.mockResolvedValue({ data: mockWeeksData });

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Updates')).toBeInTheDocument();
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Week 1: Introduction to Programming')).toBeInTheDocument();
      expect(screen.getByText('Week 2: Data Structures')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith('/api/gridfs-weeks', expect.any(Object));
  });

  test('handles network timeout error', async () => {
    const timeoutError = new Error('timeout');
    timeoutError.name = 'AbortError';
    axios.get.mockRejectedValue(timeoutError);

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Weeks')).toBeInTheDocument();
      expect(screen.getByText('Request timed out. Please check your connection.')).toBeInTheDocument();
    });
  });

  test('handles 404 error', async () => {
    const notFoundError = new Error('Not found');
    notFoundError.response = { status: 404 };
    axios.get.mockRejectedValue(notFoundError);

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('Weeks data not found. Please contact administrator.')).toBeInTheDocument();
    });
  });

  test('handles server error', async () => {
    const serverError = new Error('Server error');
    serverError.response = { status: 500 };
    axios.get.mockRejectedValue(serverError);

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
    });
  });

  test('retry functionality works', async () => {
    const user = userEvent.setup();
    
    // First call fails
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Second call succeeds
    axios.get.mockResolvedValueOnce({
      data: [{
        _id: '1',
        weekNumber: 1,
        summary: 'Week 1 content',
        photos: [],
        reportPdf: null,
        createdAt: '2024-01-01T00:00:00.000Z'
      }]
    });

    const retryButton = screen.getByText('Try Again');
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test('displays photo gallery when photos are available', async () => {
    const mockWeeksData = [{
      _id: '1',
      weekNumber: 1,
      summary: 'Week with photos',
      photos: ['photo1.jpg', 'photo2.jpg'],
      reportPdf: null,
      createdAt: '2024-01-01T00:00:00.000Z'
    }];

    axios.get.mockResolvedValue({ data: mockWeeksData });

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
      const photos = screen.getAllByAltText(/Week 1 photo/);
      expect(photos).toHaveLength(2);
    });
  });

  test('displays no photos message when no photos available', async () => {
    const mockWeeksData = [{
      _id: '1',
      weekNumber: 1,
      summary: 'Week without photos',
      photos: [],
      reportPdf: null,
      createdAt: '2024-01-01T00:00:00.000Z'
    }];

    axios.get.mockResolvedValue({ data: mockWeeksData });

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('No photos available for this week')).toBeInTheDocument();
    });
  });

  test('displays PDF viewer controls when PDF is available', async () => {
    const mockWeeksData = [{
      _id: '1',
      weekNumber: 1,
      summary: 'Week with PDF',
      photos: [],
      reportPdf: 'report.pdf',
      createdAt: '2024-01-01T00:00:00.000Z'
    }];

    axios.get.mockResolvedValue({ data: mockWeeksData });

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Report')).toBeInTheDocument();
      expect(screen.getByText('View PDF')).toBeInTheDocument();
      expect(screen.getByText('Open in New Tab')).toBeInTheDocument();
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });
  });

  test('PDF viewer toggle functionality', async () => {
    const user = userEvent.setup();
    const mockWeeksData = [{
      _id: '1',
      weekNumber: 1,
      summary: 'Week with PDF',
      photos: [],
      reportPdf: 'report.pdf',
      createdAt: '2024-01-01T00:00:00.000Z'
    }];

    axios.get.mockResolvedValue({ data: mockWeeksData });

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('View PDF')).toBeInTheDocument();
    });

    // Click to show PDF viewer
    const viewPdfButton = screen.getByText('View PDF');
    await user.click(viewPdfButton);

    expect(screen.getByText('Hide Viewer')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();

    // Click to hide PDF viewer
    const hideViewerButton = screen.getByText('Hide Viewer');
    await user.click(hideViewerButton);

    expect(screen.getByText('View PDF')).toBeInTheDocument();
    expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument();
  });

  test('photo modal functionality', async () => {
    const user = userEvent.setup();
    const mockWeeksData = [{
      _id: '1',
      weekNumber: 1,
      summary: 'Week with photos',
      photos: ['photo1.jpg', 'photo2.jpg'],
      reportPdf: null,
      createdAt: '2024-01-01T00:00:00.000Z'
    }];

    axios.get.mockResolvedValue({ data: mockWeeksData });

    render(<WeekView />);

    await waitFor(() => {
      const photos = screen.getAllByAltText(/Week 1 photo/);
      expect(photos).toHaveLength(2);
    });

    // Click on first photo to open modal
    const firstPhoto = screen.getAllByAltText(/Week 1 photo/)[0];
    await user.click(firstPhoto);

    // Modal should be visible with navigation
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  test('handles career guidance section', async () => {
    const mockWeeksData = [{
      _id: 'career',
      weekNumber: 0,
      summary: 'Career guidance resources',
      photos: [],
      reportPdf: 'career-guide.pdf',
      createdAt: '2024-01-01T00:00:00.000Z'
    }];

    axios.get.mockResolvedValue({ data: mockWeeksData });

    render(<WeekView />);

    await waitFor(() => {
      // Career section should be displayed when weekNumber is 0
      expect(screen.getByText('Career Resources')).toBeInTheDocument();
    });
  });

  test('displays empty state when no weeks available', async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('No Weeks Available')).toBeInTheDocument();
      expect(screen.getByText('No weeks have been uploaded yet.')).toBeInTheDocument();
    });
  });

  test('handles image loading errors gracefully', async () => {
    const mockWeeksData = [{
      _id: '1',
      weekNumber: 1,
      summary: 'Week with photos',
      photos: ['broken-photo.jpg'],
      reportPdf: null,
      createdAt: '2024-01-01T00:00:00.000Z'
    }];

    axios.get.mockResolvedValue({ data: mockWeeksData });

    render(<WeekView />);

    await waitFor(() => {
      const photo = screen.getByAltText(/Week 1 photo/);
      expect(photo).toBeInTheDocument();
    });

    // Simulate image error
    const photo = screen.getByAltText(/Week 1 photo/);
    fireEvent.error(photo);

    // Should show no photos message after error
    await waitFor(() => {
      expect(screen.getByText('No photos available for this week')).toBeInTheDocument();
    });
  });

  test('displays creation date correctly', async () => {
    const mockWeeksData = [{
      _id: '1',
      weekNumber: 1,
      summary: 'Week 1',
      photos: [],
      reportPdf: null,
      createdAt: '2024-01-15T00:00:00.000Z'
    }];

    axios.get.mockResolvedValue({ data: mockWeeksData });

    render(<WeekView />);

    await waitFor(() => {
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });
  });

  test('multiple retry attempts show warning', async () => {
    const user = userEvent.setup();
    
    // Mock multiple failures
    axios.get.mockRejectedValue(new Error('Network error'));
    
    render(<WeekView />);

    // Retry 3 times
    for (let i = 0; i < 3; i++) {
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/Multiple retry attempts failed/)).toBeInTheDocument();
    });
  });
});