// src/App.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App, { saveThemeToCookies, getInitialTheme } from './App';
import '@testing-library/jest-dom/extend-expect';
import Cookies from 'js-cookie';
import snapshotsIndex from './data/snapshots/index';

// Mocking js-cookie
jest.mock('js-cookie');

// Mocking snapshotsIndex
jest.mock('./data/snapshots/index', () => [
  {
    date: '2023-12-01',
    data: {
      kanbanColumns: {
        'Project Alpha': {
          'to do': [
            { id: '1', name: 'Task 1', date_updated: '1704067200000', attachments: [] },
          ],
          'in progress': [],
          'complete': [],
        },
      },
      listViewTasks: [
        { id: '1', name: 'Task 1', listName: 'To Do', description: 'Description 1' },
      ],
    },
  },
  {
    date: '2023-11-01',
    data: {
      kanbanColumns: {
        'Project Beta': {
          'to do': [],
          'in progress': [
            { id: '2', name: 'Task 2', date_updated: '1701388800000', attachments: [] },
          ],
          'complete': [],
        },
      },
      listViewTasks: [
        { id: '2', name: 'Task 2', listName: 'In Progress', description: 'Description 2' },
      ],
    },
  },
]);

describe('App Component', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    Cookies.get.mockReturnValue('light'); // Default theme

    render(<App />);

    // Check for ThemeSelector, SnapshotSelector, Toggle Button
    const themeSelector = screen.getByLabelText(/Theme/i);
    expect(themeSelector).toBeInTheDocument();

    const snapshotSelector = screen.getByLabelText(/Select Snapshot/i);
    expect(snapshotSelector).toBeInTheDocument();

    const toggleButton = screen.getByRole('button', { name: /Switch to List View/i });
    expect(toggleButton).toBeInTheDocument();

    // Check for KanbanView heading
    const kanbanHeading = screen.getByText('Project Alpha');
    expect(kanbanHeading).toBeInTheDocument();
  });

  test('loads initial theme from cookies', () => {
    Cookies.get.mockReturnValue('dark');

    render(<App />);

    // Depending on ThemeSelector implementation, adjust the checks
    // Example: Check if a dark theme class is applied to the container
    const container = screen.getByRole('main');
    expect(container).toHaveClass('MuiContainer-root'); // General class, adjust as needed

    // Further assertions may require knowledge of the actual theme implementation
  });

  test('saves theme to cookies when changed', () => {
    Cookies.get.mockReturnValue('light');

    render(<App />);

    // Simulate theme change via ThemeSelector
    // Assuming ThemeSelector has a toggle or button with accessible name 'Toggle theme'
    const themeToggle = screen.getByLabelText(/Toggle theme/i);
    fireEvent.click(themeToggle);

    // Expect Cookies.set to have been called with 'dark'
    expect(Cookies.set).toHaveBeenCalledWith('theme', 'dark', { expires: 365 });

    // Optionally, check if the theme has changed in the UI
  });

  test('sets the default snapshot to the latest one on mount', () => {
    Cookies.get.mockReturnValue('light');

    render(<App />);

    // The latest snapshot is '2023-12-01'
    const snapshotSelect = screen.getByLabelText(/Select Snapshot/i);
    expect(snapshotSelect).toHaveValue('2023-12-01');

    // Check that KanbanView is rendered with 'Project Alpha'
    const kanbanHeading = screen.getByText('Project Alpha');
    expect(kanbanHeading).toBeInTheDocument();
  });

  test('handles snapshot selection change', () => {
    Cookies.get.mockReturnValue('light');

    render(<App />);

    const snapshotSelect = screen.getByLabelText(/Select Snapshot/i);

    // Open the dropdown
    fireEvent.mouseDown(snapshotSelect);

    // Select '2023-11-01'
    const option = screen.getByText('2023-11-01');
    fireEvent.click(option);

    // Expect the selected value to update
    expect(snapshotSelect).toHaveValue('2023-11-01');

    // Check that KanbanView is updated to 'Project Beta'
    const kanbanHeading = screen.getByText('Project Beta');
    expect(kanbanHeading).toBeInTheDocument();
  });

  test('handles invalid snapshot selection gracefully', () => {
    Cookies.get.mockReturnValue('light');

    render(<App />);

    const snapshotSelect = screen.getByLabelText(/Select Snapshot/i);

    // Spy on console.warn
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

    // Simulate selecting an invalid date
    fireEvent.change(snapshotSelect, { target: { value: 'invalid-date' } });

    // Expect console.warn to have been called
    expect(consoleWarnSpy).toHaveBeenCalledWith('No snapshot found for date:', 'invalid-date');

    // Check that the fallback message is displayed
    const fallbackMessage = screen.getByText('No snapshot available for the selected date.');
    expect(fallbackMessage).toBeInTheDocument();

    consoleWarnSpy.mockRestore();
  });

  test('toggles between Kanban and List views', () => {
    Cookies.get.mockReturnValue('light');

    render(<App />);

    const toggleButton = screen.getByRole('button', { name: /Switch to List View/i });
    expect(toggleButton).toBeInTheDocument();

    // Initially, KanbanView is displayed
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();

    // Click toggle button to switch to List view
    fireEvent.click(toggleButton);

    // Now, ListView should be displayed
    const listViewTask = screen.getByText('Task 1');
    expect(listViewTask).toBeInTheDocument();

    // The button text should now be 'Switch to Kanban View'
    expect(screen.getByRole('button', { name: /Switch to Kanban View/i })).toBeInTheDocument();
  });

  test('toggle button is disabled when no snapshot is selected', () => {
    // Mock snapshotsIndex to be empty
    jest.mock('./data/snapshots/index', () => []);
    render(<App />);

    const toggleButton = screen.getByRole('button', { name: /Switch to List View/i });
    expect(toggleButton).toBeDisabled();

    // Check for fallback message
    const fallbackMessage = screen.getByText('No snapshot available for the selected date.');
    expect(fallbackMessage).toBeInTheDocument();

    // Restore the original mock
    jest.unmock('./data/snapshots/index');
  });

  test('renders ListView when in list view', () => {
    Cookies.get.mockReturnValue('light');

    render(<App />);

    const toggleButton = screen.getByRole('button', { name: /Switch to List View/i });
    fireEvent.click(toggleButton);

    // Check that ListView is rendered
    const listViewTask = screen.getByText('Task 1');
    expect(listViewTask).toBeInTheDocument();

    // Ensure KanbanView is not present
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
  });

  test('renders appropriate message when no snapshot is selected', () => {
    // Mock snapshotsIndex to be empty
    jest.mock('./data/snapshots/index', () => []);
    render(<App />);

    // The fallback message should be displayed
    const fallbackMessage = screen.getByText('No snapshot available for the selected date.');
    expect(fallbackMessage).toBeInTheDocument();

    // The toggle button should be disabled
    const toggleButton = screen.getByRole('button', { name: /Switch to List View/i });
    expect(toggleButton).toBeDisabled();

    // Restore the original mock
    jest.unmock('./data/snapshots/index');
  });

  test('matches the snapshot', () => {
    Cookies.get.mockReturnValue('light');

    const { asFragment } = render(<App />);
    expect(asFragment()).toMatchSnapshot();
  });
});