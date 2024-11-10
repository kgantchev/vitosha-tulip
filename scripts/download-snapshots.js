// scripts/download-snapshots.js

const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const mime = require('mime-types');
const sharp = require('sharp');
const fetch = require('node-fetch');
require('dotenv').config();

const CLICKUP_API_TOKEN = process.env.PERSONAL_ACCESS_TOKEN;
const SPACE_ID = process.env.CLICKUP_SPACE_ID;
const SNAPSHOTS_DIR = path.join(__dirname, '../src/data/snapshots');

const headers = {
    Authorization: CLICKUP_API_TOKEN,
};

// Ensure the snapshots directory exists
if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

// Get the start and end of the current month in milliseconds
const currentMonthStart = dayjs().startOf('month').valueOf();
const nextMonthStart = dayjs().add(1, 'month').startOf('month').valueOf();

// Fetch all lists from the specified space
async function fetchLists() {
    try {
        const response = await fetch(`https://api.clickup.com/api/v2/space/${SPACE_ID}/list`, { headers });
        const data = await response.json();
        return data.lists || [];
    } catch (error) {
        console.error('Error fetching lists:', error.message);
        return [];
    }
}

// Fetch list details including statuses
async function fetchListDetails(listId) {
    try {
        const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}`, { headers });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching list details for list ID ${listId}:`, error.message);
        return null;
    }
}

// Fetch task details including attachments
async function fetchTaskDetails(taskId) {
    try {
        const response = await fetch(
            `https://api.clickup.com/api/v2/task/${taskId}?include=attachments`,
            { headers }
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching details for task ID ${taskId}:`, error.message);
        return null;
    }
}

// Download and process an attachment
async function processAttachment(attachment) {
    try {
        const attachmentUrl = attachment.url;

        // Fetch the image as a buffer
        const response = await fetch(attachmentUrl, { headers });
        const buffer = await response.buffer();

        // Use sharp to create a thumbnail
        const thumbnailBuffer = await sharp(buffer)
            .resize(100, 100, { fit: 'inside' }) // Adjust size as needed
            .jpeg({ quality: 60 }) // Adjust quality as needed
            .toBuffer();

        // Convert the thumbnail to a Base64 string
        const base64String = thumbnailBuffer.toString('base64');

        // Return the Base64 string with appropriate data URI prefix
        return `data:image/jpeg;base64,${base64String}`;
    } catch (error) {
        console.error(`Error processing attachment ${attachment.id}:`, error.message);
        return null;
    }
}

// Sanitize task data to remove sensitive information
function sanitizeTask(task, listName) {
    return {
        id: task.id,
        name: task.name,
        status: task.status.status,
        date_created: task.date_created,
        date_updated: task.date_updated,
        date_status_changed: task.date_status_changed || null,
        listName, // Add list name as a badge
        attachments: task.attachments || [], // Include attachments info
    };
}

// Fetch and organize tasks for a given list by status
async function fetchTasksForList(listId, listName, statuses) {
    try {
        // Include 'date_status_changed' and closed tasks in the API request
        const response = await fetch(
            `https://api.clickup.com/api/v2/list/${listId}/task?include=date_status_changed&include_closed=true`,
            { headers }
        );
        const data = await response.json();
        const tasks = data.tasks || [];

        // Initialize all statuses in kanbanColumns
        const kanbanColumns = {};
        statuses.forEach(status => {
            kanbanColumns[status.status.toLowerCase()] = [];
        });

        const sanitizedTasks = [];

        for (const task of tasks) {
            const taskStatus = task.status.status.toLowerCase();

            // Determine if the task should be included based on your criteria
            let includeTask = false;

            if (taskStatus === 'complete') {
                // For 'Complete' tasks, include only if updated this month
                const dateUpdated = parseInt(task.date_updated, 10);
                if (dateUpdated >= currentMonthStart && dateUpdated < nextMonthStart) {
                    includeTask = true;
                }
            } else {
                // For other tasks, include regardless of update date
                includeTask = true;
            }

            if (!includeTask) {
                continue;
            }

            // Fetch task details including attachments
            const taskDetails = await fetchTaskDetails(task.id);
            if (!taskDetails) continue;

            // Filter attachments to include only images
            const attachments = taskDetails.attachments || [];
            const imageAttachments = [];

            for (const attachment of attachments) {
                // Determine if the attachment is an image
                const mimeType = mime.lookup(attachment.title);
                if (mimeType && mimeType.startsWith('image/')) {
                    const base64Image = await processAttachment(attachment);
                    if (base64Image) {
                        imageAttachments.push({
                            id: attachment.id,
                            fileName: attachment.title,
                            base64Image, // Include the Base64 string
                        });
                    }
                }
            }

            // Add attachments info to the task
            task.attachments = imageAttachments;

            // Sanitize task data
            const sanitizedTask = sanitizeTask(task, listName);

            // Add task to kanban columns and sanitized tasks array
            const status = sanitizedTask.status.toLowerCase();
            if (kanbanColumns[status]) {
                kanbanColumns[status].push(sanitizedTask);
            } else {
                kanbanColumns[status] = [sanitizedTask];
            }

            sanitizedTasks.push(sanitizedTask);
        }

        return { kanbanColumns, tasks: sanitizedTasks };
    } catch (error) {
        console.error(`Error processing tasks for list ${listName}:`, error.message);
        return { kanbanColumns: {}, tasks: [] };
    }
}

// Main function to download all snapshots
async function downloadSnapshot() {
    const lists = await fetchLists();
    const currentDate = dayjs().format('YYYY-MM');
    const snapshotPath = path.join(SNAPSHOTS_DIR, `${currentDate}.json`);

    const snapshotData = {
        date: currentDate,
        lists: [],
        kanbanColumns: {},
        listViewTasks: [],
    };

    // Store the space name
    const spaceName = lists.length > 0 && lists[0].space ? lists[0].space.name : 'Unknown Space';

    for (const lst of lists) {
        const { id: listId, name: listName } = lst;

        // Fetch list details to get statuses
        const listDetails = await fetchListDetails(listId);
        if (!listDetails) continue;

        const statuses = listDetails.statuses || [];

        // Fetch tasks and organize them
        const { kanbanColumns, tasks } = await fetchTasksForList(listId, listName, statuses);

        // Skip lists with no tasks after filtering
        if (tasks.length === 0) {
            console.log(`No tasks to include in ${listName} after filtering.`);
            continue;
        }

        // Add organized tasks for the Kanban view under each list name
        snapshotData.kanbanColumns[listName] = kanbanColumns;

        // Add sanitized tasks to the list view
        snapshotData.listViewTasks.push(...tasks);

        // Collect list information
        const numColumns = statuses.length;
        const columnsInfo = {};

        statuses.forEach(status => {
            const statusName = status.status.toLowerCase();
            const numTasks = kanbanColumns[statusName] ? kanbanColumns[statusName].length : 0;
            columnsInfo[statusName] = numTasks;
        });

        snapshotData.lists.push({
            id: listId,
            name: listName,
            numColumns,
            columnsInfo,
        });
    }

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotData, null, 2));
    console.log(`Snapshot saved to ${snapshotPath}`);
}

// Exported functions for testing
module.exports = {
    fetchLists,
    fetchListDetails,
    fetchTaskDetails,
    processAttachment,
    sanitizeTask,
    fetchTasksForList,
    downloadSnapshot, // You can export this if you want to test the main function
};

// Execute the main function if the script is run directly
if (require.main === module) {
    downloadSnapshot();
}