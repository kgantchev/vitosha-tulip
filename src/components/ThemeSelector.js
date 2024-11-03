// src/components/ThemeSelector.js
import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Cookies from 'js-cookie';

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        iconColor: '#f9a825'
    },
});

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9',
        },
        iconColor: '#ffeb3b'
    },
});

const ThemeSelector = ({ themeMode, setThemeMode }) => {
    const handleThemeChange = (event, newTheme) => {
        if (newTheme) {
            setThemeMode(newTheme);
            Cookies.set('theme', newTheme, { expires: 365 });
        }
    };

    return (
        <ThemeProvider theme={themeMode === 'light' ? lightTheme : darkTheme}>
            <ToggleButtonGroup
                value={themeMode}
                exclusive
                onChange={handleThemeChange}
                aria-label="theme toggle"
                sx={{
                    mt: 2,
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 1,
                    width: 100,
                }}
            >
                <ToggleButton
                    value="light"
                    aria-label="light mode"
                    sx={{
                        flex: 1,
                        color: themeMode === 'light' ? lightTheme.palette.iconColor : 'text.secondary',
                        bgcolor: themeMode === 'light' ? 'background.paper' : lightTheme.palette.background.default,
                        '&:hover': {
                            bgcolor: themeMode === 'light' ? lightTheme.palette.grey[200] : lightTheme.palette.grey[100],
                        },
                        borderRight: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <LightMode fontSize="small" />
                </ToggleButton>
                <ToggleButton
                    value="dark"
                    aria-label="dark mode"
                    sx={{
                        flex: 1,
                        color: themeMode === 'dark' ? darkTheme.palette.iconColor : 'text.secondary',
                        bgcolor: themeMode === 'dark' ? 'background.paper' : darkTheme.palette.background.default,
                        '&:hover': {
                            bgcolor: themeMode === 'dark' ? darkTheme.palette.grey[800] : darkTheme.palette.grey[700],
                        },
                    }}
                >
                    <DarkMode fontSize="small" />
                </ToggleButton>
            </ToggleButtonGroup>
        </ThemeProvider>
    );
};

export default ThemeSelector;