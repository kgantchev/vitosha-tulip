// tests/download-snapshots.test.js

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const dayjs = require('dayjs');
const sharp = require('sharp');
const mime = require('mime-types');

jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn(),
        writeFile: jest.fn(),
    },
}));
jest.mock('node-fetch');
jest.mock('sharp');
jest.mock('mime-types');

const {
    fetchLists,
    fetchListDetails,
    fetchTaskDetails,
    processAttachment,
    sanitizeTask,
    fetchTasksForList,
    downloadSnapshot,
} = require('../scripts/download-snapshots.js');

beforeEach(() => {
    process.env.PERSONAL_ACCESS_TOKEN = 'mock-token';
    process.env.CLICKUP_SPACE_ID = 'mock-space-id';
});

afterEach(() => {
    delete process.env.PERSONAL_ACCESS_TOKEN;
    delete process.env.CLICKUP_SPACE_ID;
});

describe('download-snapshots.js', () => {
    const mockToken = 'mock-token';
    const mockSpaceId = 'mock-space-id';
    const currentMonth = dayjs().format('YYYY-MM');
    const snapshotPath = path.join(__dirname, '../src/data/snapshots', `${currentMonth}.json`);
    const mockListId = 'list1';
    const mockListName = 'List 1';
    const mockTaskId = 'task1';
    const currentMonthStart = dayjs().startOf('month').valueOf();

    beforeEach(() => {
        jest.clearAllMocks();

        sharp.mockReturnValue({
            resize: jest.fn().mockReturnThis(),
            png: jest.fn().mockReturnThis(),
            webp: jest.fn().mockReturnThis(),
            jpeg: jest.fn().mockReturnThis(),
            toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data')),
        });

        mime.lookup.mockReturnValue('image/jpeg');
    });

    describe('ensureSnapshotsDir', () => {
        test('should create snapshots directory if it does not exist', async () => {
            fs.mkdir.mockResolvedValue();
            fetch.mockResolvedValue({ ok: true, json: async () => ({ lists: [] }) });
            fs.writeFile.mockResolvedValue();
            await downloadSnapshot();
            expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('src/data/snapshots'), { recursive: true });
        });

        test('should handle directory already exists error', async () => {
            fs.mkdir.mockRejectedValueOnce({ code: 'EEXIST' });
            fs.writeFile.mockResolvedValue();
            fetch.mockResolvedValue({ ok: true, json: async () => ({ lists: [] }) });
            await downloadSnapshot();
            expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('src/data/snapshots'), { recursive: true });
            expect(fs.writeFile).toHaveBeenCalled();
        });

        test('should throw error for other mkdir failures', async () => {
            fs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));
            await expect(downloadSnapshot()).rejects.toThrow('Permission denied');
        });
    });

    describe('fetchLists', () => {
        test('should return lists on successful API call', async () => {
            const mockLists = { lists: [{ id: 'list1', name: 'List 1', space: { name: 'Test Space' } }] };
            fetch.mockResolvedValue({ ok: true, json: async () => mockLists });
            const result = await fetchLists();
            expect(result).toEqual(mockLists.lists);
        });

        test('should return empty array on API failure', async () => {
            fetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });
            const result = await fetchLists();
            expect(result).toEqual([]);
        });

        test('should return empty array if environment variables are missing', async () => {
            delete process.env.PERSONAL_ACCESS_TOKEN;
            const result = await fetchLists();
            expect(result).toEqual([]);
        });
    });

    describe('fetchListDetails', () => {
        test('should return list details with statuses', async () => {
            const mockDetails = { id: mockListId, name: mockListName, statuses: [{ status: 'To Do' }] };
            fetch.mockResolvedValue({ ok: true, json: async () => mockDetails });
            const result = await fetchListDetails(mockListId);
            expect(result).toEqual(mockDetails);
        });

        test('should return null on API failure', async () => {
            fetch.mockResolvedValue({ ok: false });
            const result = await fetchListDetails(mockListId);
            expect(result).toBeNull();
        });

        test('should return null if listId is missing', async () => {
            const result = await fetchListDetails(null);
            expect(result).toBeNull();
        });
    });

    describe('fetchTaskDetails', () => {
        test('should return task details with attachments', async () => {
            const mockTask = { id: mockTaskId, name: 'Task 1', attachments: [] };
            fetch.mockResolvedValue({ ok: true, json: async () => mockTask });
            const result = await fetchTaskDetails(mockTaskId);
            expect(result).toEqual(mockTask);
        });

        test('should return null on API failure', async () => {
            fetch.mockResolvedValue({ ok: false });
            const result = await fetchTaskDetails(mockTaskId);
            expect(result).toBeNull();
        });

        test('should return null if taskId is missing', async () => {
            const result = await fetchTaskDetails(null);
            expect(result).toBeNull();
        });
    });

    describe('processAttachment', () => {
        test('should process image attachment and return Base64 string', async () => {
            fetch.mockResolvedValue({ ok: true, buffer: async () => Buffer.from('mock-image') });
            mime.lookup.mockReturnValue('image/jpeg');
            const attachment = { id: 'attach1', title: 'image.jpg', url: 'http://example.com/image.jpg' };
            const result = await processAttachment(attachment);
            expect(result).toMatch(/^data:image\/jpeg;base64,/);
        });

        test('should return null on fetch failure', async () => {
            fetch.mockResolvedValue({ ok: false });
            const result = await processAttachment({ url: 'bad-url' });
            expect(result).toBeNull();
        });
    });

    describe('sanitizeTask', () => {
        test('should sanitize task data', () => {
            const task = {
                id: 'task1',
                name: 'Task 1',
                status: { status: 'To Do' },
                date_created: '1',
                date_updated: '2',
                date_status_changed: '3',
                attachments: [],
            };
            const result = sanitizeTask(task, mockListName);
            expect(result).toEqual({
                id: 'task1',
                name: 'Task 1',
                status: 'To Do',
                date_created: '1',
                date_updated: '2',
                date_status_changed: '3',
                listName: mockListName,
                attachments: [],
            });
        });
    });

    describe('downloadSnapshot', () => {
        test('should save empty snapshot if no lists are returned', async () => {
            fetch.mockResolvedValue({ ok: true, json: async () => ({ lists: [] }) });
            fs.mkdir.mockResolvedValue();
            fs.writeFile.mockResolvedValue();
            await downloadSnapshot();
            expect(fs.writeFile).toHaveBeenCalledWith(
                snapshotPath,
                JSON.stringify(
                    {
                        date: currentMonth,
                        lists: [],
                        kanbanColumns: {},
                        listViewTasks: [],
                    },
                    null,
                    2
                )
            );
        });
    });
});
