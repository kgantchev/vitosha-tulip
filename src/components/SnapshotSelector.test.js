// src/components/SnapshotSelector.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SnapshotSelector from './SnapshotSelector';

const mockSnapshots = [
    { date: "2024-11", file: "2024-11.json" },
    { date: "2024-10", file: "2024-10.json" },
    { date: "2023-12", file: "2023-12.json" },
];

describe('SnapshotSelector Component', () => {
    test('renders years and months correctly', () => {
        render(<SnapshotSelector snapshots={mockSnapshots} onChange={jest.fn()} />);

        // Check for unique years and months
        expect(screen.getByText(/2024/i)).toBeInTheDocument();
        expect(screen.getByText(/2023/i)).toBeInTheDocument();
    });

    test('renders available months for selected year', () => {
        render(<SnapshotSelector snapshots={mockSnapshots} onChange={jest.fn()} />);

        // Select year and check months
        fireEvent.click(screen.getByText(/2024/i));
        expect(screen.getByText(/November/i)).toBeInTheDocument();
        expect(screen.getByText(/October/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText(/2023/i));
        expect(screen.getByText(/December/i)).toBeInTheDocument();
    });

    test('calls onChange with correct file when month is selected', () => {
        const mockOnChange = jest.fn();
        render(<SnapshotSelector snapshots={mockSnapshots} onChange={mockOnChange} />);

        // Select year and month
        fireEvent.click(screen.getByText(/2024/i));
        fireEvent.click(screen.getByText(/November/i));

        // Verify onChange is called with correct file
        expect(mockOnChange).toHaveBeenCalledWith("2024-11.json");
    });

    test('calls onChange with null if no snapshot is found for selected date', () => {
        const mockOnChange = jest.fn();
        render(<SnapshotSelector snapshots={mockSnapshots} onChange={mockOnChange} />);

        // Select an invalid date (by simulating that the snapshot is not in mock data)
        fireEvent.click(screen.getByText(/2024/i));
        fireEvent.click(screen.getByText(/December/i));

        expect(mockOnChange).toHaveBeenCalledWith(null);
    });
});