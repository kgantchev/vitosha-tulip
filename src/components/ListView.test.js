// src/components/ListView.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import ListView from './ListView';

const mockTasks = [
    { id: "1", name: "Task 1", listName: "Test List", description: "Description for Task 1" },
    { id: "2", name: "Task 2", listName: "Test List", description: "Description for Task 2" },
];

describe('ListView Component', () => {
    test('renders tasks with details', () => {
        render(<ListView tasks={mockTasks} />);

        // Check task names and descriptions
        expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Description for Task 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Task 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Description for Task 2/i)).toBeInTheDocument();
    });

    test('renders list name as a chip', () => {
        render(<ListView tasks={mockTasks} />);

        // Check for list name in chip
        expect(screen.getAllByText(/Test List/i)).toHaveLength(2);
    });

    test('renders empty message if no tasks are provided', () => {
        render(<ListView tasks={[]} />);

        // Check that no tasks are rendered
        expect(screen.queryByText(/Task 1/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Description for Task 1/i)).not.toBeInTheDocument();
    });
});