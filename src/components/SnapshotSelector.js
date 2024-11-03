// src/components/SnapshotSelector.js
import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

function SnapshotSelector({ snapshots, onChange, value }) {
    const handleChange = (event) => {
        const date = event.target.value;
        onChange(date);
    };

    // Sort snapshots in descending order to show the latest first in the dropdown
    const sortedSnapshots = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));

    return (
        <FormControl fullWidth variant="outlined" sx={{ my: 2 }}>
            <InputLabel id="snapshot-selector-label">Select Snapshot</InputLabel>
            <Select
                labelId="snapshot-selector-label"
                value={value}
                label="Select Snapshot"
                onChange={handleChange}
            >
                {sortedSnapshots.map((snapshot) => (
                    <MenuItem key={snapshot.date} value={snapshot.date}>
                        {snapshot.date}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export default SnapshotSelector;