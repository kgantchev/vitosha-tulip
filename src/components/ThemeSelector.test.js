// src/components/ThemeSelector.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSelector from './ThemeSelector';
import Cookies from 'js-cookie';
import '@testing-library/jest-dom';

// Mock js-cookie to test cookie setting behavior
jest.mock('js-cookie');

describe('ThemeSelector Component', () => {
    let setThemeModeMock;

    beforeEach(() => {
        setThemeModeMock = jest.fn();
        Cookies.set.mockClear();
    });

    test('renders correctly with light theme selected', () => {
        render(<ThemeSelector themeMode="light" setThemeMode={setThemeModeMock} />);

        // Verify that the light mode button is selected
        const lightModeButton = screen.getByLabelText('light mode');
        const darkModeButton = screen.getByLabelText('dark mode');

        expect(lightModeButton).toHaveAttribute('aria-pressed', 'true');
        expect(darkModeButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('renders correctly with dark theme selected', () => {
        render(<ThemeSelector themeMode="dark" setThemeMode={setThemeModeMock} />);

        // Verify that the dark mode button is selected
        const darkModeButton = screen.getByLabelText('dark mode');
        const lightModeButton = screen.getByLabelText('light mode');

        expect(darkModeButton).toHaveAttribute('aria-pressed', 'true');
        expect(lightModeButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('calls setThemeMode and saves theme to cookies when switching to dark theme', () => {
        render(<ThemeSelector themeMode="light" setThemeMode={setThemeModeMock} />);

        // Click on the dark mode button to change theme
        const darkModeButton = screen.getByLabelText('dark mode');
        fireEvent.click(darkModeButton);

        // Verify setThemeMode is called with 'dark'
        expect(setThemeModeMock).toHaveBeenCalledWith('dark');

        // Verify that Cookies.set was called to save the theme
        expect(Cookies.set).toHaveBeenCalledWith('theme', 'dark', { expires: 365 });
    });

    test('calls setThemeMode and saves theme to cookies when switching to light theme', () => {
        render(<ThemeSelector themeMode="dark" setThemeMode={setThemeModeMock} />);

        // Click on the light mode button to change theme
        const lightModeButton = screen.getByLabelText('light mode');
        fireEvent.click(lightModeButton);

        // Verify setThemeMode is called with 'light'
        expect(setThemeModeMock).toHaveBeenCalledWith('light');

        // Verify that Cookies.set was called to save the theme
        expect(Cookies.set).toHaveBeenCalledWith('theme', 'light', { expires: 365 });
    });

    test('does not call setThemeMode or set cookies when the same theme is clicked', () => {
        render(<ThemeSelector themeMode="light" setThemeMode={setThemeModeMock} />);

        // Click on the light mode button when already in light mode
        const lightModeButton = screen.getByLabelText('light mode');
        fireEvent.click(lightModeButton);

        // setThemeMode and Cookies.set should not be called since the theme did not change
        expect(setThemeModeMock).not.toHaveBeenCalled();
        expect(Cookies.set).not.toHaveBeenCalled();
    });
});