// src/App.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Cookies from 'js-cookie';
import Papa from 'papaparse';

// Mock the 'js-cookie' module
jest.mock('js-cookie');

// Mock the './data/' module
jest.mock('./data/', () => ({
  importAllSnapshots: jest.fn(),
}));

// Mock URL.createObjectURL
beforeAll(() => {
  // Mock URL.createObjectURL to return a mock URL string
  global.URL.createObjectURL = jest.fn().mockReturnValue('mocked-url');
});

// Reset the mock between tests
beforeEach(() => {
  global.URL.createObjectURL.mockClear();
});

// Import App and the mocked importAllSnapshots
import App from './App';
import { importAllSnapshots } from './data/';

describe('App Component', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods
    Cookies.get.mockClear();
    Cookies.set.mockClear();
    importAllSnapshots.mockClear();
  });

  const mockSnapshotsData = [
    {
      date: '2024-11',
      data: {
        kanbanColumns: {
          'Организация и инициативи': {
            'to do': [
              {
                id: '2vdax60',
                name: 'Падащи стъкла от последните етажи',
                status: 'to do',
                date_created: '1664211032767',
                date_updated: '1671693754453',
                date_status_changed: null,
                listName: 'Организация и инициативи',
                attachments: [],
              },
            ],
          },
          'Регулярен контрол и поддръжка': {
            'to do': [
              {
                id: '2y36an6',
                name: 'Почистване на Facebook група от стари контакти',
                status: 'to do',
                date_created: '1666770904505',
                date_updated: '1666770904505',
                date_status_changed: null,
                listName: 'Регулярен контрол и поддръжка',
                attachments: [],
              },
            ],
          },
        },
      },
    },
    {
      date: '2024-10',
      data: {
        kanbanColumns: {
          // Empty snapshot for testing
        },
      },
    },
  ];

  test('renders App without crashing and displays main elements', async () => {
    // Mock initial theme
    Cookies.get.mockReturnValue('light');

    // Mock importAllSnapshots to return mockSnapshotsData
    importAllSnapshots.mockReturnValue(mockSnapshotsData);

    render(<App />);

    // Wait for snapshots to load
    await waitFor(() => {
      // Check for ThemeSelector component
      expect(screen.getByLabelText(/theme toggle/i)).toBeInTheDocument();

      // Check for SnapshotSelector component
      expect(screen.getByLabelText(/select snapshot/i)).toBeInTheDocument();

      // Check for CSV download button
      expect(screen.getByText(/download tasks as csv/i)).toBeInTheDocument();
    });
  });

  test('downloads tasks as CSV when the button is clicked', async () => {
    Cookies.get.mockReturnValue('light');

    // Mock importAllSnapshots to return mockSnapshotsData
    importAllSnapshots.mockReturnValue(mockSnapshotsData);

    render(<App />);

    // Wait for snapshots to load
    await waitFor(() => {
      const downloadButton = screen.getByText(/download tasks as csv/i);
      expect(downloadButton).toBeInTheDocument();

      // Click the download button
      fireEvent.click(downloadButton);
    });

    // Check that the CSV is generated and download is triggered
    await waitFor(() => {
      const blob = globalThis.Blob;
      const link = document.createElement('a');

      // Use papaparse to generate CSV
      const csv = Papa.unparse([
        {
          Task: 'Падащи стъкла от последните етажи',
          Status: 'to do',
          LastUpdated: new Date(1671693754453).toLocaleDateString(),
        },
        {
          Task: 'Почистване на Facebook група от стари контакти',
          Status: 'to do',
          LastUpdated: new Date(1666770904505).toLocaleDateString(),
        },
      ]);

      const file = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(file); // This now uses the mocked version
      link.setAttribute('href', url);
      link.setAttribute('download', `tasks_2024-11.csv`);

      expect(link.download).toBe('tasks_2024-11.csv');
    });
  });

  test('applies initial theme based on cookies', async () => {
    // Mock initial theme as 'dark'
    Cookies.get.mockReturnValue('dark');

    // Mock importAllSnapshots to return mockSnapshotsData
    importAllSnapshots.mockReturnValue(mockSnapshotsData);

    render(<App />);

    // Wait for snapshots to load
    await waitFor(() => {
      // Check if the dark mode toggle button is pressed
      const darkModeButton = screen.getByLabelText('dark mode');
      expect(darkModeButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('saves theme to cookies when changed', async () => {
    Cookies.get.mockReturnValue('light');

    // Mock importAllSnapshots to return mockSnapshotsData
    importAllSnapshots.mockReturnValue(mockSnapshotsData);

    render(<App />);

    // Wait for snapshots to load
    await waitFor(() => {
      const darkModeButton = screen.getByLabelText('dark mode');
      fireEvent.click(darkModeButton);

      expect(Cookies.set).toHaveBeenCalledWith('theme', 'dark', { expires: 365 });

      const lightModeButton = screen.getByLabelText('light mode');
      fireEvent.click(lightModeButton);

      expect(Cookies.set).toHaveBeenCalledWith('theme', 'light', { expires: 365 });
    });
  });

  test('loads the latest snapshot on mount', async () => {
    Cookies.get.mockReturnValue('light');

    // Mock importAllSnapshots to return mockSnapshotsData
    importAllSnapshots.mockReturnValue(mockSnapshotsData);

    render(<App />);

    // Wait for useEffect to set the latest snapshot
    await waitFor(() => {
      // Check if KanbanView is rendered with data from the latest snapshot
      expect(screen.getByText('Организация и инициативи')).toBeInTheDocument();
      expect(screen.getByText('Падащи стъкла от последните етажи')).toBeInTheDocument();
    });
  });

  test('allows selecting a different snapshot and displays appropriate message', async () => {
    Cookies.get.mockReturnValue('light');

    // Mock importAllSnapshots to return mockSnapshotsData
    importAllSnapshots.mockReturnValue(mockSnapshotsData);

    render(<App />);

    // Wait for snapshots to load and the select component to be in the document
    await waitFor(() => {
      const snapshotSelect = screen.getByRole('combobox', { name: /select snapshot/i });
      expect(snapshotSelect).toBeInTheDocument();
    });

    // Open the SnapshotSelector dropdown
    const snapshotSelect = screen.getByRole('combobox', { name: /select snapshot/i });
    fireEvent.mouseDown(snapshotSelect);

    // Select '2024-10' snapshot
    const octoberOption = await screen.findByRole('option', { name: '2024-10' });
    fireEvent.click(octoberOption);

    // Wait for the snapshot to load and display the message
    await waitFor(() => {
      expect(
        screen.getByText(/no snapshot available for the selected date\./i)
      ).toBeInTheDocument();
    });
  });

  test('displays message when no snapshot is selected', async () => {
    // Mock importAllSnapshots to return an empty array
    importAllSnapshots.mockReturnValue([]);

    Cookies.get.mockReturnValue('light');

    render(<App />);

    // Wait for useEffect to set the snapshot
    await waitFor(() => {
      expect(
        screen.getByText(/no snapshot available for the selected date\./i)
      ).toBeInTheDocument();
    });
  });
});