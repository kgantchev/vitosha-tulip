// scripts/tests/download-snapshots.test.js

const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const mime = require('mime-types');
const sharp = require('sharp');
const fetch = require('node-fetch');
const { Readable } = require('stream');

// Import the functions to test
const {
    fetchLists,
    fetchListDetails,
    fetchTaskDetails,
    processAttachment,
    sanitizeTask,
    fetchTasksForList,
    downloadSnapshot,
} = require('../scripts/download-snapshots.js');

// Mock dependencies
jest.mock('node-fetch');
jest.mock('sharp');
jest.mock('fs');

describe('download-snapshots.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchLists', () => {
        it('should fetch lists from the ClickUp API', async () => {
            const mockResponse = {
                lists: [{ id: '1', name: 'List 1' }],
            };

            fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue(mockResponse),
            });

            const lists = await fetchLists();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/space/'),
                expect.objectContaining({
                    headers: expect.any(Object),
                })
            );
            expect(lists).toEqual(mockResponse.lists);
        });

        it('should return an empty array on error', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            const lists = await fetchLists();

            expect(lists).toEqual([]);
        });
    });

    describe('fetchListDetails', () => {
        it('should fetch list details from the ClickUp API', async () => {
            const mockListDetails = { id: '1', statuses: [] };

            fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue(mockListDetails),
            });

            const listDetails = await fetchListDetails('1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/list/1'),
                expect.objectContaining({
                    headers: expect.any(Object),
                })
            );
            expect(listDetails).toEqual(mockListDetails);
        });

        it('should return null on error', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            const listDetails = await fetchListDetails('1');

            expect(listDetails).toBeNull();
        });
    });

    describe('fetchTaskDetails', () => {
        it('should fetch task details from the ClickUp API', async () => {
            const mockTaskDetails = { id: '1', attachments: [] };

            fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue(mockTaskDetails),
            });

            const taskDetails = await fetchTaskDetails('1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/task/1'),
                expect.objectContaining({
                    headers: expect.any(Object),
                })
            );
            expect(taskDetails).toEqual(mockTaskDetails);
        });

        it('should return null on error', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            const taskDetails = await fetchTaskDetails('1');

            expect(taskDetails).toBeNull();
        });
    });

    describe('processAttachment', () => {
        it('should process an attachment and return a base64 string', async () => {
            const mockAttachment = { id: '1', url: 'http://example.com/image.jpg' };
            const mockImageBuffer = Buffer.from('image data');

            // Mock fetching the image
            fetch.mockResolvedValue({
                buffer: jest.fn().mockResolvedValue(mockImageBuffer),
            });

            // Mock sharp processing
            sharp.mockReturnValue({
                resize: jest.fn().mockReturnThis(),
                jpeg: jest.fn().mockReturnThis(),
                toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail data')),
            });

            const base64String = await processAttachment(mockAttachment);

            expect(fetch).toHaveBeenCalledWith(mockAttachment.url, expect.any(Object));
            expect(sharp).toHaveBeenCalledWith(mockImageBuffer);
            expect(base64String).toMatch(/^data:image\/jpeg;base64,/);
        });

        it('should return null on error', async () => {
            const mockAttachment = { id: '1', url: 'http://example.com/image.jpg' };

            fetch.mockRejectedValue(new Error('Network error'));

            const result = await processAttachment(mockAttachment);

            expect(result).toBeNull();
        });
    });

    describe('sanitizeTask', () => {
        it('should sanitize task data', () => {
            const task = {
                id: '1',
                name: 'Task 1',
                status: { status: 'to do' },
                date_created: '1234567890',
                date_updated: '1234567890',
                date_status_changed: null,
                attachments: [],
            };

            const sanitized = sanitizeTask(task, 'List 1');

            expect(sanitized).toEqual({
                id: '1',
                name: 'Task 1',
                status: 'to do',
                date_created: '1234567890',
                date_updated: '1234567890',
                date_status_changed: null,
                listName: 'List 1',
                attachments: [],
            });
        });
    });

    // Additional tests for fetchTasksForList and downloadSnapshot can be added similarly
});