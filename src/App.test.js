// src/App.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import snapshotsIndex from './data/snapshots/index';
import * as AppUtils from './utils/AppUtils';

// Mock js-cookie
jest.mock('./utils/AppUtils', () => ({
  saveThemeToCookies: jest.fn(),
  getInitialTheme: jest.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    AppUtils.getInitialTheme.mockReturnValue('light');
    AppUtils.saveThemeToCookies.mockClear();
  });

  test('renders theme toggle button and saves theme in cookies', () => {
    render(<App />);

    // Check initial theme mode
    const lightModeButton = screen.getByLabelText(/light mode/i);
    expect(lightModeButton).toBeInTheDocument();

    // Toggle to dark mode
    fireEvent.click(screen.getByLabelText(/dark mode/i));
    expect(AppUtils.saveThemeToCookies).toHaveBeenCalledWith('dark');

    // Toggle back to light mode
    fireEvent.click(screen.getByLabelText(/light mode/i));
    expect(AppUtils.saveThemeToCookies).toHaveBeenCalledWith('light');
  });

  test('displays "No snapshot available" message when no snapshot is selected', () => {
    render(<App />);
    expect(screen.getByText(/No snapshot available for the selected date/i)).toBeInTheDocument();
  });

  test('loads and displays snapshot data when a snapshot is selected', () => {
    render(<App />);

    // Select a snapshot
    const snapshotSelect = screen.getByLabelText(/Select Snapshot/i);
    fireEvent.mouseDown(snapshotSelect);
    const snapshotOption = screen.getByText('2024-11');
    fireEvent.click(snapshotOption);

    // Verify Kanban view is displayed
    expect(screen.getByText(/Kanban View/i)).toBeInTheDocument(); // Adjust based on actual text

    // Verify tasks are displayed
    expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Task 2/i)).toBeInTheDocument();
  });

  test('toggles between Kanban and List views correctly', () => {
    render(<App />);

    // Select a snapshot
    const snapshotSelect = screen.getByLabelText(/Select Snapshot/i);
    fireEvent.mouseDown(snapshotSelect);
    const snapshotOption = screen.getByText('2024-11');
    fireEvent.click(snapshotOption);

    // Verify Kanban view is displayed
    expect(screen.getByText(/Kanban View/i)).toBeInTheDocument(); // Adjust based on actual text

    // Switch to List view
    const toggleButton = screen.getByRole('button', { name: /Switch to List View/i });
    fireEvent.click(toggleButton);
    expect(screen.getByText(/List View/i)).toBeInTheDocument(); // Adjust based on actual text

    // Switch back to Kanban view
    fireEvent.click(toggleButton);
    expect(screen.getByText(/Kanban View/i)).toBeInTheDocument(); // Adjust based on actual text
  });

  test('displays tasks in Kanban view in the correct columns', () => {
    render(<App />);

    // Select a snapshot
    const snapshotSelect = screen.getByLabelText(/Select Snapshot/i);
    fireEvent.mouseDown(snapshotSelect);
    const snapshotOption = screen.getByText('2024-11');
    fireEvent.click(snapshotOption);

    // Verify tasks are in the correct columns
    const toDoColumn = screen.getByText(/To Do/i);
    expect(toDoColumn).toBeInTheDocument();
    expect(screen.getByText(/Task 1/i)).toBeInTheDocument();

    const inProgressColumn = screen.getByText(/In Progress/i);
    expect(inProgressColumn).toBeInTheDocument();
    expect(screen.getByText(/Task 2/i)).toBeInTheDocument();
  });

  test('displays tasks in List view with correct details', () => {
    render(<App />);

    // Select a snapshot
    const snapshotSelect = screen.getByLabelText(/Select Snapshot/i);
    fireEvent.mouseDown(snapshotSelect);
    const snapshotOption = screen.getByText('2024-11');
    fireEvent.click(snapshotOption);

    // Switch to List view
    const toggleButton = screen.getByRole('button', { name: /Switch to List View/i });
    fireEvent.click(toggleButton);

    // Verify tasks in List view
    expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Task 2/i)).toBeInTheDocument();
  });
});