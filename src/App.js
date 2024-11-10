// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, CssBaseline, Container, Typography } from '@mui/material';
import { lightTheme, darkTheme } from './components/ThemeSelector';
import ThemeSelector from './components/ThemeSelector';
import KanbanView from './components/KanbanView';
import SnapshotSelector from './components/SnapshotSelector';
import Cookies from 'js-cookie';
import { importAllSnapshots } from './data/';

// Exported utility functions for easier testing
export const saveThemeToCookies = (themeMode) => {
  Cookies.set('theme', themeMode, { expires: 365 });
};

export const getInitialTheme = () => {
  return Cookies.get('theme') || 'light';
};

// Function to check if the snapshot is empty
function isSnapshotEmpty(snapshot) {
  const hasKanbanData =
    snapshot.kanbanColumns && Object.keys(snapshot.kanbanColumns).length > 0;
  return !hasKanbanData;
}

function App() {
  // Theme state
  const initialThemeMode = getInitialTheme();
  const [themeMode, setThemeMode] = useState(initialThemeMode);

  // Snapshot state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // Load snapshots dynamically
  const snapshots = useMemo(() => importAllSnapshots(), []);

  // Sort snapshots by date descending
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => b.date.localeCompare(a.date));
  }, [snapshots]);

  // Save theme to cookies whenever it changes
  useEffect(() => {
    saveThemeToCookies(themeMode);
  }, [themeMode]);

  // Set the default snapshot to the latest one on component mount
  useEffect(() => {
    if (sortedSnapshots.length > 0) {
      const latestSnapshot = sortedSnapshots[0];
      setSelectedDate(latestSnapshot.date);
      setSelectedSnapshot(latestSnapshot.data);
    }
  }, [sortedSnapshots]);

  // Handle snapshot selection change
  const handleSnapshotChange = (date) => {
    const snapshot = sortedSnapshots.find((s) => s.date === date);
    if (snapshot) {
      setSelectedSnapshot(snapshot.data);
      setSelectedDate(date);
    } else {
      setSelectedSnapshot(null);
      setSelectedDate('');
    }
  };

  return (
    <ThemeProvider theme={themeMode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg" role="main">
        {/* Theme Selector Component */}
        <ThemeSelector themeMode={themeMode} setThemeMode={setThemeMode} />

        {/* Snapshot Selector Component */}
        <SnapshotSelector
          snapshots={sortedSnapshots}
          onChange={handleSnapshotChange}
          value={selectedDate}
        />

        {/* Display Selected Snapshot */}
        {selectedSnapshot && !isSnapshotEmpty(selectedSnapshot) ? (
          <KanbanView kanbanColumns={selectedSnapshot.kanbanColumns} />
        ) : (
          <Typography variant="h6">No snapshot available for the selected date.</Typography>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;