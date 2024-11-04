// src/components/SnapshotSelector.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SnapshotSelector from './SnapshotSelector';
import '@testing-library/jest-dom';

const mockSnapshots = [
    { date: '2024-09', data: {} },
    { date: '2024-10', data: {} },
    { date: '2024-11', data: {} },
    { date: '2024-12', data: {} },
];

describe('SnapshotSelector Component', () => {
    it('renders without crashing and shows the label', () => {
        render(
            <SnapshotSelector
                snapshots={mockSnapshots}
                onChange={() => { }}
                value=""
            />
        );

        const labelElement = screen.getByLabelText(/Select Snapshot/i);
        expect(labelElement).toBeInTheDocument();
    });

    it('displays snapshots in descending order with placeholder', () => {
        render(
            <SnapshotSelector
                snapshots={mockSnapshots}
                onChange={() => { }}
                value=""
            />
        );

        fireEvent.mouseDown(screen.getByLabelText(/Select Snapshot/i));

        const menuItems = screen.getAllByRole('option');
        const expectedOrder = ['Select Snapshot', '2024-12', '2024-11', '2024-10', '2024-09'];
        const renderedOrder = menuItems.map((item) => item.textContent);

        expect(renderedOrder).toEqual(expectedOrder);
    });

    it('calls onChange handler with the correct date when a snapshot is selected', () => {
        const handleChange = jest.fn();
        render(
            <SnapshotSelector
                snapshots={mockSnapshots}
                onChange={handleChange}
                value=""
            />
        );

        fireEvent.mouseDown(screen.getByLabelText(/Select Snapshot/i));
        fireEvent.click(screen.getByText('2024-11'));

        expect(handleChange).toHaveBeenCalledWith('2024-11');
    });

    it('does not call onChange when the same value is selected', () => {
        const handleChange = jest.fn();
        render(
            <SnapshotSelector
                snapshots={mockSnapshots}
                onChange={handleChange}
                value="2024-12"
            />
        );

        fireEvent.mouseDown(screen.getByLabelText(/Select Snapshot/i));

        // Select the same value; ensure we click the option inside the dropdown
        const dropdownOption = screen.getByRole('option', { name: '2024-12' });
        fireEvent.click(dropdownOption);

        expect(handleChange).not.toHaveBeenCalled();
    });

    it('displays the selected snapshot value correctly', () => {
        render(
            <SnapshotSelector
                snapshots={mockSnapshots}
                onChange={() => { }}
                value="2024-10"
            />
        );

        const selectElement = screen.getByLabelText(/Select Snapshot/i);
        expect(selectElement).toHaveTextContent('2024-10');
    });

    it('handles an empty snapshots array gracefully by showing no options', () => {
        render(
            <SnapshotSelector
                snapshots={[]}
                onChange={() => { }}
                value=""
            />
        );

        fireEvent.mouseDown(screen.getByLabelText(/Select Snapshot/i));

        const menuItems = screen.queryAllByRole('option');
        expect(menuItems.length).toBe(0);
    });

    it('displays a placeholder if no value is selected and snapshots exist', () => {
        render(
            <SnapshotSelector
                snapshots={mockSnapshots}
                onChange={() => { }}
                value=""
            />
        );

        const selectElement = screen.getByLabelText(/Select Snapshot/i);
        expect(selectElement).toHaveTextContent('Select Snapshot');
    });

    it('updates the selected value when a different option is clicked', () => {
        const handleChange = jest.fn();
        render(
            <SnapshotSelector
                snapshots={mockSnapshots}
                onChange={handleChange}
                value="2024-11"
            />
        );

        fireEvent.mouseDown(screen.getByLabelText(/Select Snapshot/i));
        fireEvent.click(screen.getByText('2024-09'));

        expect(handleChange).toHaveBeenCalledWith('2024-09');
    });

    // Additional Tests for Better Coverage

    it('does not render the placeholder when a value is selected', () => {
        render(
            <SnapshotSelector
                snapshots={mockSnapshots}
                onChange={() => { }}
                value="2024-10"
            />
        );

        fireEvent.mouseDown(screen.getByLabelText(/Select Snapshot/i));

        // The placeholder should not be present
        const placeholderOption = screen.queryByRole('option', { name: 'Select Snapshot' });
        expect(placeholderOption).not.toBeInTheDocument();
    });

    it('handles multiple snapshots with the same date gracefully', () => {
        const duplicateSnapshots = [
            { date: '2024-12', data: {} },
            { date: '2024-12', data: {} },
            { date: '2024-11', data: {} },
        ];

        render(
            <SnapshotSelector
                snapshots={duplicateSnapshots}
                onChange={() => { }}
                value=""
            />
        );

        fireEvent.mouseDown(screen.getByLabelText(/Select Snapshot/i));

        const menuItems = screen.getAllByRole('option');
        const expectedOrder = ['Select Snapshot', '2024-12', '2024-12', '2024-11'];
        const renderedOrder = menuItems.map((item) => item.textContent);

        expect(renderedOrder).toEqual(expectedOrder);
    });
});