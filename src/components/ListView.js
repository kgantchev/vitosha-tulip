// src/components/ListView.js
import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    Typography, // Add this import
} from '@mui/material';

const ListView = ({ tasks = [] }) => {
    return (
        <List>
            {tasks.map((task) => (
                <React.Fragment key={task.id}>
                    <ListItem alignItems="flex-start">
                        <ListItemText
                            primary={task.name}
                            secondary={
                                <>
                                    <Chip label={task.listName} size="small" sx={{ mt: 1 }} />
                                    {task.description && <Typography>{task.description}</Typography>}
                                </>
                            }
                        />
                    </ListItem>
                    <Divider component="li" />
                </React.Fragment>
            ))}
        </List>
    );
};

export default ListView;