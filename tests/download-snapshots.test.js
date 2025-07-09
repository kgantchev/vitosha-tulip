// scripts/tests/download-snapshots.test.js
const fs = require('fs').promises;
const path = require('path');
const dayjs = require('dayjs');
const mime = require('mime-types');
const fetch = require('node-fetch');
const {
    fetchLists,
    fetchListDetails,
    fetchTaskDetails,
    processAttachment,
    sanitizeTask,
    fetchTasksForList,
    downloadSnapshot,
    fetchPreviousSnapshot,
    fetchPreviousSnapshots,
} = require('../download-snapshots.js');

// Mock dependencies
jest.mock('node-fetch');
jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn().mockResolvedValue(),
        access: jest.fn(),
        writeFile: jest.fn().mockResolvedValue(),
    },
}));
jest.mock('mime-types', () => ({
    lookup: jest.fn(),
}));
jest.mock('dayjs');

describe('download-snapshots.js', () => {
    let mockCurrentDate;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a real dayjs instance for the current date
        const realDayjs = jest.requireActual('dayjs');
        mockCurrentDate = realDayjs();

        // Mock dayjs to return a dynamic instance
        dayjs.mockImplementation(() => {
            const instance = realDayjs(mockCurrentDate);
            instance.subtract = jest.fn().mockImplementation((num, unit) => {
                const newDate = realDayjs(mockCurrentDate).subtract(num, unit);
                const newInstance = realDayjs(newDate);
                newInstance.year = jest.fn().mockReturnValue(newDate.year());
                newInstance.month = jest.fn().mockReturnValue(newDate.month());
                newInstance.format = jest.fn().mockReturnValue(newDate.format('YYYY-MM'));
                newInstance.startOf = jest.fn().mockReturnThis();
                newInstance.add = jest.fn().mockReturnThis();
                newInstance.valueOf = jest.fn().mockReturnValue(newDate.valueOf());
                return newInstance;
            });
            instance.year = jest.fn().mockReturnValue(mockCurrentDate.year());
            instance.month = jest.fn().mockReturnValue(mockCurrentDate.month());
            instance.format = jest.fn().mockReturnValue(mockCurrentDate.format('YYYY-MM'));
            instance.startOf = jest.fn().mockReturnThis();
            instance.add = jest.fn().mockReturnThis();
            instance.valueOf = jest.fn().mockReturnValue(mockCurrentDate.valueOf());
            return instance;
        });
    });

    describe('fetchLists', () => {
        it('fetches lists from ClickUp API', async () => {
            const mockResponse = { lists: [{ id: '1', name: 'List 1' }] };
            fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
            });

            const lists = await fetchLists();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/space/'),
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(lists).toEqual(mockResponse.lists);
        });

        it('returns empty array on error', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            const lists = await fetchLists();

            expect(lists).toEqual([]);
        });
    });

    describe('fetchListDetails', () => {
        it('fetches list details from ClickUp API', async () => {
            const mockListDetails = { id: '1', statuses: [] };
            fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockListDetails),
            });

            const listDetails = await fetchListDetails('1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/list/1'),
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(listDetails).toEqual(mockListDetails);
        });

        it('returns null on error', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            const listDetails = await fetchListDetails('1');

            expect(listDetails).toBeNull();
        });
    });

    describe('fetchTaskDetails', () => {
        it('fetches task details from ClickUp API', async () => {
            const mockTaskDetails = { id: '1', attachments: [] };
            fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTaskDetails),
            });

            const taskDetails = await fetchTaskDetails('1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/task/1'),
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(taskDetails).toEqual(mockTaskDetails);
        });

        it('returns null on error', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            const taskDetails = await fetchTaskDetails('1');

            expect(taskDetails).toBeNull();
        });
    });

    describe('processAttachment', () => {
        it('processes an attachment and returns a base64 string', async () => {
            const mockAttachment = { id: '1', url: 'http://example.com/image.jpg', title: 'image.jpg' };
            const mockImageBuffer = Buffer.from('image data');
            const processedBuffer = Buffer.from('processed image data');

            fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(mockImageBuffer),
            });

            jest.spyOn(Buffer, 'from').mockReturnValue(mockImageBuffer);

            const sharpMock = {
                resize: jest.fn().mockReturnThis(),
                jpeg: jest.fn().mockReturnThis(),
                toBuffer: jest.fn().mockResolvedValue(processedBuffer),
            };
            require('sharp').mockReturnValue(sharpMock);

            mime.lookup.mockReturnValue('image/jpeg');

            const base64String = await processAttachment(mockAttachment);

            expect(fetch).toHaveBeenCalledWith(mockAttachment.url, expect.any(Object));
            expect(Buffer.from).toHaveBeenCalledWith(mockImageBuffer);
            expect(sharpMock.resize).toHaveBeenCalledWith(300, 300, { fit: 'inside' });
            expect(sharpMock.jpeg).toHaveBeenCalledWith({ quality: 90 });
            expect(base64String).toMatch(/^data:image\/jpeg;base64,/);
        });

        it('returns null on fetch error', async () => {
            const mockAttachment = { id: '1', url: 'http://example.com/image.jpg' };
            fetch.mockRejectedValue(new Error('Network error'));

            const result = await processAttachment(mockAttachment);

            expect(result).toBeNull();
        });
    });

    describe('fetchTasksForList', () => {
        it('returns empty kanban columns and tasks when no tasks are found', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ tasks: [] }),
            });

            const { kanbanColumns, tasks } = await fetchTasksForList('1', 'List 1', []);

            expect(kanbanColumns).toEqual({});
            expect(tasks).toEqual([]);
        });
    });

    describe('sanitizeTask', () => {
        it('sanitizes task data', () => {
            const task = {
                id: '1',
                name: 'Task 1',
                status: { status: 'to do' },
                date_created: '1234567890',
                date_updated: '1234567890',
                date_status_changed: null,
                attachments: [],
                email: 'unsanitized@email.com',
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

    describe('fetchPreviousSnapshot', () => {
        it('fetches and saves a snapshot from the deployed site', async () => {
            const mockSnapshot = { date: mockCurrentDate.subtract(1, 'month').format('YYYY-MM'), lists: [] };
            fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockSnapshot),
            });
            fs.writeFile.mockResolvedValue();

            const year = mockCurrentDate.subtract(1, 'month').year();
            const month = mockCurrentDate.subtract(1, 'month').format('MM');
            const result = await fetchPreviousSnapshot(year, month);

            expect(fetch).toHaveBeenCalledWith(
                `https://vitosha-tulip.surge.sh/data/snapshots/${year}-${month}.json`,
                expect.any(Object)
            );
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`${year}-${month}\\.json$`)),
                JSON.stringify(mockSnapshot, null, 2)
            );
            expect(result).toEqual(mockSnapshot);
        });

        it('returns null and does not save if snapshot is not found (404)', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 404,
            });

            const year = mockCurrentDate.subtract(1, 'month').year();
            const month = mockCurrentDate.subtract(1, 'month').format('MM');
            const result = await fetchPreviousSnapshot(year, month);

            expect(fetch).toHaveBeenCalledWith(
                `https://vitosha-tulip.surge.sh/data/snapshots/${year}-${month}.json`,
                expect.any(Object)
            );
            expect(fs.writeFile).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('returns null and does not save on fetch error', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            const year = mockCurrentDate.subtract(1, 'month').year();
            const month = mockCurrentDate.subtract(1, 'month').format('MM');
            const result = await fetchPreviousSnapshot(year, month);

            expect(fetch).toHaveBeenCalledWith(
                `https://vitosha-tulip.surge.sh/data/snapshots/${year}-${month}.json`,
                expect.any(Object)
            );
            expect(fs.writeFile).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('fetchPreviousSnapshots', () => {
        it('fetches missing snapshots for previous months', async () => {
            // Mock fs.access: one month missing, one exists
            fs.access
                .mockRejectedValueOnce(new Error('File not found')) // Previous month missing
                .mockResolvedValue(); // Others exist

            const previousMonth = mockCurrentDate.subtract(1, 'month');
            const mockSnapshot = { date: previousMonth.format('YYYY-MM'), lists: [] };
            fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockSnapshot),
            });
            fs.writeFile.mockResolvedValue();

            await fetchPreviousSnapshots();

            expect(fs.access).toHaveBeenCalledTimes(12); // Checks 12 months
            expect(fs.access).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`${previousMonth.format('YYYY-MM')}\\.json$`))
            );
            expect(fetch).toHaveBeenCalledWith(
                `https://vitosha-tulip.surge.sh/data/snapshots/${previousMonth.format('YYYY-MM')}.json`,
                expect.any(Object)
            );
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`${previousMonth.format('YYYY-MM')}\\.json$`)),
                JSON.stringify(mockSnapshot, null, 2)
            );
        });

        it('skips fetching if all snapshots exist locally', async () => {
            fs.access.mockResolvedValue(); // All snapshots exist

            await fetchPreviousSnapshots();

            expect(fs.access).toHaveBeenCalledTimes(12); // Checks 12 months
            expect(fetch).not.toHaveBeenCalled();
            expect(fs.writeFile).not.toHaveBeenCalled();
        });

        it('handles partial availability of snapshots', async () => {
            // Mock fs.access: two months missing, others exist
            fs.access
                .mockRejectedValueOnce(new Error('File not found')) // Previous month missing
                .mockRejectedValueOnce(new Error('File not found')) // Two months ago missing
                .mockResolvedValue(); // Others exist

            const previousMonth = mockCurrentDate.subtract(1, 'month');
            const earlierMonth = mockCurrentDate.subtract(2, 'month');
            const mockSnapshot1 = { date: previousMonth.format('YYYY-MM'), lists: [] };
            const mockSnapshot2 = { date: earlierMonth.format('YYYY-MM'), lists: [] };
            fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue(mockSnapshot1),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue(mockSnapshot2),
                });

            fs.writeFile.mockResolvedValue();

            await fetchPreviousSnapshots();

            expect(fs.access).toHaveBeenCalledTimes(12);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(fetch).toHaveBeenCalledWith(
                `https://vitosha-tulip.surge.sh/data/snapshots/${previousMonth.format('YYYY-MM')}.json`,
                expect.any(Object)
            );
            expect(fetch).toHaveBeenCalledWith(
                `https://vitosha-tulip.surge.sh/data/snapshots/${earlierMonth.format('YYYY-MM')}.json`,
                expect.any(Object)
            );
            expect(fs.writeFile).toHaveBeenCalledTimes(2);
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`${previousMonth.format('YYYY-MM')}\\.json$`)),
                JSON.stringify(mockSnapshot1, null, 2)
            );
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`${earlierMonth.format('YYYY-MM')}\\.json$`)),
                JSON.stringify(mockSnapshot2, null, 2)
            );
        });
    });

    describe('downloadSnapshot', () => {
        it('calls fetchPreviousSnapshots and generates current snapshot', async () => {
            const mockLists = [{ id: '1', name: 'List 1' }];
            fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ lists: mockLists }),
            });
            fs.writeFile.mockResolvedValue();
            fs.access.mockResolvedValue(); // No previous snapshots to fetch

            await downloadSnapshot();

            expect(fs.access).toHaveBeenCalled(); // fetchPreviousSnapshots called
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`${mockCurrentDate.format('YYYY-MM')}\\.json$`)),
                expect.any(String)
            );
        });

        it('handles errors from fetchPreviousSnapshots gracefully', async () => {
            fs.access.mockRejectedValue(new Error('File not found'));
            fetch.mockRejectedValue(new Error('Network error')); // fetchPreviousSnapshots fails
            fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({ lists: [] }), // For current snapshot
            });
            fs.writeFile.mockResolvedValue();

            await downloadSnapshot();

            expect(fs.access).toHaveBeenCalled();
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('https://vitosha-tulip.surge.sh/data/snapshots/'),
                expect.any(Object)
            );
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`${mockCurrentDate.format('YYYY-MM')}\\.json$`)),
                expect.any(String)
            );
        });
    });
});