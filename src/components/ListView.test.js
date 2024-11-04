// src/components/ListView.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import ListView from './ListView';
import '@testing-library/jest-dom';

describe('ListView Component', () => {
    // Mock Data for Tasks
    const mockTasks = [
        {
            id: '1',
            name: 'Task One',
            listName: 'To Do',
            description: 'Description for Task One',
        },
        {
            id: '2',
            name: 'Task Two',
            listName: 'In Progress',
            // No description provided
        },
        {
            id: '3',
            name: 'Task Three',
            listName: 'Completed',
            description: 'Description for Task Three',
        },
    ];

    test('renders without crashing when tasks array is empty', () => {
        render(<ListView tasks={[]} />);

        // Since there are no tasks, the list should be empty
        const listItems = screen.queryAllByRole('listitem');
        expect(listItems.length).toBe(0);
    });

    test('renders the correct number of tasks', () => {
        render(<ListView tasks={mockTasks} />);

        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBe(mockTasks.length);
    });

    test('displays task names correctly', () => {
        render(<ListView tasks={mockTasks} />);

        mockTasks.forEach((task) => {
            const taskName = screen.getByText(task.name);
            expect(taskName).toBeInTheDocument();
        });
    });

    test('displays Chip with correct listName for each task', () => {
        render(<ListView tasks={mockTasks} />);

        mockTasks.forEach((task) => {
            const chip = screen.getByText(task.listName);
            expect(chip).toBeInTheDocument();
            expect(chip).toHaveClass('MuiChip-root'); // Ensure it's a Chip component
        });
    });

    test('displays task description when provided', () => {
        render(<ListView tasks={mockTasks} />);

        mockTasks.forEach((task) => {
            if (task.description) {
                const description = screen.getByText(task.description);
                expect(description).toBeInTheDocument();
                expect(description.tagName.toLowerCase()).toBe('p'); // Typography renders as <p> by default
            }
        });
    });

    test('does not render task description when not provided', () => {
        render(<ListView tasks={mockTasks} />);

        // Task with id '2' does not have a description
        const taskWithoutDescription = mockTasks.find((task) => task.id === '2');
        expect(screen.queryByText(taskWithoutDescription.description)).not.toBeInTheDocument();
    });

    test('renders Divider between tasks', () => {
        render(<ListView tasks={mockTasks} />);

        // There should be one less Divider than the number of tasks
        const dividers = screen.getAllByRole('separator');
        expect(dividers.length).toBe(mockTasks.length);
    });

    test('matches the snapshot', () => {
        const { asFragment } = render(<ListView tasks={mockTasks} />);
        expect(asFragment()).toMatchSnapshot();
    });
});