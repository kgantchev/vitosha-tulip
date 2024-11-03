// src/components/KanbanView.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import KanbanView from './KanbanView';

const mockKanbanData = {
    "Test List": {
        "to do": [{ id: "1", name: "Task 1", date_updated: "1671693754453", attachments: [] }],
        "in progress": [
            {
                id: "2",
                name: "Task 2",
                date_updated: "1671693754453",
                attachments: [{ fileName: "image1.jpg", base64Image: "data:image/jpeg;base64,...base64data..." }]
            }
        ],
    },
};

describe('KanbanView Component', () => {
    test('renders columns with tasks correctly', () => {
        render(<KanbanView kanbanColumns={mockKanbanData} />);

        // Check for column names
        expect(screen.getByText(/TO DO/i)).toBeInTheDocument();
        expect(screen.getByText(/IN PROGRESS/i)).toBeInTheDocument();

        // Check for task names
        expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Task 2/i)).toBeInTheDocument();
    });

    test('renders task details and attachment images if present', () => {
        render(<KanbanView kanbanColumns={mockKanbanData} />);

        // Check task name and updated date
        expect(screen.getByText(/Task 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Last updated: 2022-12-22/i)).toBeInTheDocument(); // Adjust date to match mock data

        // Check if the attachment image is displayed correctly
        const image = screen.getByAltText(/image1.jpg/i);
        expect(image).toHaveAttribute("src", "data:image/jpeg;base64,...base64data...");
    });

    test('renders empty columns if there are no tasks', () => {
        const emptyKanbanData = {
            "Empty List": {
                "to do": [],
                "in progress": [],
                "complete": [],
            },
        };

        render(<KanbanView kanbanColumns={emptyKanbanData} />);

        // Check for empty column headers without tasks
        expect(screen.getByText(/TO DO/i)).toBeInTheDocument();
        expect(screen.getByText(/IN PROGRESS/i)).toBeInTheDocument();
        expect(screen.getByText(/COMPLETE/i)).toBeInTheDocument();
    });
});