import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, CssBaseline, Container, Typography, Button } from '@mui/material';
import { lightTheme, darkTheme } from './components/ThemeSelector';
import ThemeSelector from './components/ThemeSelector';
import KanbanView from './components/KanbanView';
import SnapshotSelector from './components/SnapshotSelector';
import Cookies from 'js-cookie';
import { importAllSnapshots } from './data/';
import Papa from 'papaparse';

export const saveThemeToCookies = (themeMode) => {
  Cookies.set('theme', themeMode, { expires: 365 });
};

export const getInitialTheme = () => {
  return Cookies.get('theme') || 'light';
};

const downloadCSV = (snapshot, date) => {
  if (!snapshot || isSnapshotEmpty(snapshot)) {
    alert('No data to download');
    return;
  }

  // Flatten the tasks data into a format suitable for CSV
  const tasks = Object.values(snapshot.kanbanColumns).flatMap((column) =>
    Object.values(column).flat()
  );

  const tasksForCSV = tasks.map((task) => ({
    Task: task.name,
    Status: task.status,
    LastUpdated: new Date(Number(task.date_updated)).toLocaleDateString(),
  }));

  // Convert to CSV using PapaParse and trigger download
  const csv = Papa.unparse(tasksForCSV);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `tasks_${date}.csv`);
  link.click();
};

function isSnapshotEmpty(snapshot) {
  const hasKanbanData =
    snapshot.kanbanColumns && Object.keys(snapshot.kanbanColumns).length > 0;
  return !hasKanbanData;
}

function App() {
  const initialThemeMode = getInitialTheme();
  const [themeMode, setThemeMode] = useState(initialThemeMode);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const snapshots = useMemo(() => importAllSnapshots(), []);
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => b.date.localeCompare(a.date));
  }, [snapshots]);

  useEffect(() => {
    saveThemeToCookies(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (sortedSnapshots.length > 0) {
      const latestSnapshot = sortedSnapshots[0];
      setSelectedDate(latestSnapshot.date);
      setSelectedSnapshot(latestSnapshot.data);
    }
  }, [sortedSnapshots]);

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
        <ThemeSelector themeMode={themeMode} setThemeMode={setThemeMode} />
        <SnapshotSelector
          snapshots={sortedSnapshots}
          onChange={handleSnapshotChange}
          value={selectedDate}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={() => downloadCSV(selectedSnapshot, selectedDate)}
          sx={{ mt: 3 }}
        >
          Download Tasks as CSV
        </Button>

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