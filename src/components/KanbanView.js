// src/components/KanbanView.js
import React from 'react';
import dayjs from 'dayjs';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardMedia,
} from '@mui/material';

const KanbanView = ({ kanbanColumns = {} }) => {
    const columnOrder = ['to do', 'definition', 'in progress', 'in review', 'complete'];

    return (
        <Box>
            {Object.keys(kanbanColumns).map((listName) => (
                <Box key={listName} mb={4}>
                    <Typography variant="h4" gutterBottom>
                        {listName}
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap', // Allow columns to wrap to the next line
                            gap: 2,
                        }}
                    >
                        {columnOrder.map((columnName) => {
                            const tasks = kanbanColumns[listName][columnName] || [];
                            return (
                                <Box
                                    key={columnName}
                                    sx={{
                                        flex: '1 1 200px',
                                        minWidth: '200px',
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                        component="h6"
                                        data-testid="column-heading"
                                    >
                                        {columnName.toUpperCase()}
                                    </Typography>
                                    {tasks.map((task) => (
                                        <Card key={task.id} sx={{ mb: 2 }}>
                                            <CardContent>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {task.name}
                                                </Typography>
                                                {task.attachments?.[0] && (
                                                    <CardMedia
                                                        component="img"
                                                        src={task.attachments[0].base64Image}
                                                        alt={task.attachments[0].fileName}
                                                        sx={{ mt: 1, borderRadius: 1 }}
                                                    />
                                                )}
                                                <Typography variant="caption" color="textSecondary">
                                                    Last updated: {dayjs(Number(task.date_updated)).format('YYYY-MM-DD')}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default KanbanView;