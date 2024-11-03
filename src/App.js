// src/App.js
import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Container, Typography, Button } from '@mui/material';
import { lightTheme, darkTheme } from './components/ThemeSelector';
import ThemeSelector from './components/ThemeSelector';
import KanbanView from './components/KanbanView';
import ListView from './components/ListView';
import SnapshotSelector from './components/SnapshotSelector';
import snapshotsIndex from './data/snapshots/index';
import Cookies from 'js-cookie';

// Utility functions for theme handling
export const saveThemeToCookies = (themeMode) => {
  Cookies.set('theme', themeMode, { expires: 365 });
};

export const getInitialTheme = () => {
  return Cookies.get('theme') || 'light';
};

function App() {
  // Theme state
  const initialThemeMode = getInitialTheme();
  const [themeMode, setThemeMode] = useState(initialThemeMode);

  // Snapshot state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // View state
  const [view, setView] = useState('kanban'); // 'kanban' or 'list'

  // Save theme to cookies whenever it changes
  useEffect(() => {
    saveThemeToCookies(themeMode);
  }, [themeMode]);

  // Set the default snapshot to the latest one on component mount
  useEffect(() => {
    if (snapshotsIndex.length > 0) {
      // Sort snapshots in descending order to get the latest first
      const sortedSnapshots = [...snapshotsIndex].sort((a, b) => b.date.localeCompare(a.date));
      const latestSnapshot = sortedSnapshots[0];
      console.log('Setting default snapshot to:', latestSnapshot.date);
      setSelectedDate(latestSnapshot.date);
      setSelectedSnapshot(latestSnapshot.data);
    }
  }, []); // Empty dependency array to run only once

  // Handle snapshot selection change
  const handleSnapshotChange = (date) => {
    const snapshot = snapshotsIndex.find(s => s.date === date);
    if (snapshot) {
      setSelectedSnapshot(snapshot.data);
      setSelectedDate(date);
      console.log('Selected snapshot:', date);
    } else {
      setSelectedSnapshot(null);
      setSelectedDate('');
      console.warn('No snapshot found for date:', date);
    }
  };

  // Toggle between Kanban and List views
  const toggleView = () => setView(prevView => (prevView === 'kanban' ? 'list' : 'kanban'));

  return (
    <ThemeProvider theme={themeMode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg">
        {/* Theme Selector Component */}
        <ThemeSelector themeMode={themeMode} setThemeMode={setThemeMode} />

        {/* Snapshot Selector Component */}
        <SnapshotSelector
          snapshots={snapshotsIndex}
          onChange={handleSnapshotChange}
          value={selectedDate} // Pass the selected date as a prop
        />

        {/* Toggle View Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={toggleView}
          sx={{ my: 2 }}
          disabled={!selectedSnapshot} // Disable if no snapshot is selected
        >
          Switch to {view === 'kanban' ? 'List' : 'Kanban'} View
        </Button>

        {/* Display Selected Snapshot */}
        {selectedSnapshot ? (
          view === 'kanban' ? (
            <KanbanView kanbanColumns={selectedSnapshot.kanbanColumns} />
          ) : (
            <ListView tasks={selectedSnapshot.listViewTasks} />
          )
        ) : (
          <Typography variant="h6">No snapshot available for the selected date.</Typography>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;