// src/components/KanbanView.test.js
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import KanbanView from './KanbanView';
import '@testing-library/jest-dom';
import dayjs from 'dayjs';

// Mock Data for Kanban Columns
const mockKanbanColumns = {
    "Project Alpha": {
        "to do": [
            {
                id: '1',
                name: 'Design the landing page',
                date_updated: String(dayjs('2023-10-01').valueOf()),
                attachments: [
                    {
                        base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
                        fileName: 'design.png',
                    },
                ],
            },
            {
                id: '2',
                name: 'Set up CI/CD pipeline',
                date_updated: String(dayjs('2023-10-03').valueOf()),
            },
        ],
        "in progress": [
            {
                id: '3',
                name: 'Develop authentication module',
                date_updated: String(dayjs('2023-10-05').valueOf()),
                attachments: [
                    {
                        base64Image: 'data:image/png;base64,abcd1234...',
                        fileName: 'auth_flow.png',
                    },
                ],
            },
        ],
    },
    "Project Beta": {
        "to do": [],
        "complete": [
            {
                id: '4',
                name: 'Market research',
                date_updated: String(dayjs('2023-09-20').valueOf()),
            },
        ],
    },
};

describe('KanbanView Component', () => {
    test('renders without crashing when kanbanColumns is empty', () => {
        render(<KanbanView kanbanColumns={{}} />);

        // Since kanbanColumns is empty, no list names should be rendered
        const listNameElements = screen.queryAllByRole('heading', { level: 4 });
        expect(listNameElements.length).toBe(0);
    });

    test('renders list names correctly', () => {
        render(<KanbanView kanbanColumns={mockKanbanColumns} />);

        // Check for "Project Alpha" and "Project Beta" headings
        const projectAlpha = screen.getByRole('heading', { name: 'Project Alpha' });
        const projectBeta = screen.getByRole('heading', { name: 'Project Beta' });

        expect(projectAlpha).toBeInTheDocument();
        expect(projectBeta).toBeInTheDocument();
    });

    test('renders columns in the specified order', () => {
        render(<KanbanView kanbanColumns={mockKanbanColumns} />);

        const expectedOrder = ['TO DO', 'DEFINITION', 'IN PROGRESS', 'IN REVIEW', 'COMPLETE'];

        Object.keys(mockKanbanColumns).forEach((listName) => {
            const listHeading = screen.getByRole('heading', { name: listName });
            const listSection = listHeading.parentElement;
            const listWithin = within(listSection);

            const renderedColumnNames = [];

            expectedOrder.forEach((columnName) => {
                const columnHeading = listWithin.getByText(columnName, { selector: 'h6' });
                expect(columnHeading).toBeInTheDocument();
                renderedColumnNames.push(columnHeading.textContent.trim());
            });

            expect(renderedColumnNames).toEqual(expectedOrder);
        });
    });

    test('renders tasks within the correct columns', () => {
        render(<KanbanView kanbanColumns={mockKanbanColumns} />);

        // Check for tasks in "Project Alpha" -> "TO DO"
        const projectAlphaSection = screen.getByRole('heading', { name: 'Project Alpha' }).parentElement;
        const alphaWithin = within(projectAlphaSection);

        expect(alphaWithin.getByText('TO DO')).toBeInTheDocument();
        expect(alphaWithin.getByText('Design the landing page')).toBeInTheDocument();
        expect(alphaWithin.getByText('Set up CI/CD pipeline')).toBeInTheDocument();

        // Check for tasks in "Project Alpha" -> "IN PROGRESS"
        expect(alphaWithin.getByText('IN PROGRESS')).toBeInTheDocument();
        expect(alphaWithin.getByText('Develop authentication module')).toBeInTheDocument();

        // Check for tasks in "Project Beta" -> "COMPLETE"
        const projectBetaSection = screen.getByRole('heading', { name: 'Project Beta' }).parentElement;
        const betaWithin = within(projectBetaSection);

        expect(betaWithin.getByText('COMPLETE')).toBeInTheDocument();
        expect(betaWithin.getByText('Market research')).toBeInTheDocument();
    });

    test('renders attachments when present', () => {
        render(<KanbanView kanbanColumns={mockKanbanColumns} />);

        // Task with attachment: "Design the landing page"
        const designTaskImage = screen.getByAltText('design.png');
        expect(designTaskImage).toBeInTheDocument();
        expect(designTaskImage).toHaveAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...');

        // Task with attachment: "Develop authentication module"
        const authTaskImage = screen.getByAltText('auth_flow.png');
        expect(authTaskImage).toBeInTheDocument();
        expect(authTaskImage).toHaveAttribute('src', 'data:image/png;base64,abcd1234...');
    });

    test('does not render attachments when not present', () => {
        render(<KanbanView kanbanColumns={mockKanbanColumns} />);

        // Task without attachment: "Set up CI/CD pipeline"
        const ciTaskImage = screen.queryByAltText('Set up CI/CD pipeline');
        expect(ciTaskImage).not.toBeInTheDocument();

        // Task without attachment: "Market research"
        const marketTaskImage = screen.queryByAltText('Market research');
        expect(marketTaskImage).not.toBeInTheDocument();
    });

    test('formats and displays the last updated date correctly', () => {
        render(<KanbanView kanbanColumns={mockKanbanColumns} />);

        // "Design the landing page" updated on 2023-10-01
        const designTaskDate = screen.getByText('Last updated: 2023-10-01');
        expect(designTaskDate).toBeInTheDocument();

        // "Set up CI/CD pipeline" updated on 2023-10-03
        const ciTaskDate = screen.getByText('Last updated: 2023-10-03');
        expect(ciTaskDate).toBeInTheDocument();

        // "Develop authentication module" updated on 2023-10-05
        const authTaskDate = screen.getByText('Last updated: 2023-10-05');
        expect(authTaskDate).toBeInTheDocument();

        // "Market research" updated on 2023-09-20
        const marketTaskDate = screen.getByText('Last updated: 2023-09-20');
        expect(marketTaskDate).toBeInTheDocument();
    });

    test('handles multiple list names correctly', () => {
        render(<KanbanView kanbanColumns={mockKanbanColumns} />);

        // Ensure both "Project Alpha" and "Project Beta" sections are present
        const projectAlpha = screen.getByRole('heading', { name: 'Project Alpha' });
        const projectBeta = screen.getByRole('heading', { name: 'Project Beta' });

        expect(projectAlpha).toBeInTheDocument();
        expect(projectBeta).toBeInTheDocument();
    });

    test('matches the snapshot', () => {
        const { asFragment } = render(<KanbanView kanbanColumns={mockKanbanColumns} />);
        expect(asFragment()).toMatchSnapshot();
    });
});