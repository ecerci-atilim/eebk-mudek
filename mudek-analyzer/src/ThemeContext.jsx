// src/ThemeContext.jsx

import { createContext, useState, useMemo, useContext } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme, blueTheme, purpleTheme } from './themes';

const ThemeContext = createContext();

export const themeMap = {
  light: lightTheme,
  dark: darkTheme,
  blue: blueTheme,
  purple: purpleTheme,
};

export function ThemeProvider({ children }) {
  // Get the saved theme from localStorage or default to 'light'
  const [themeName, setThemeName] = useState(localStorage.getItem('app_theme') || 'light');

  const activeTheme = useMemo(() => themeMap[themeName] || lightTheme, [themeName]);

  const toggleTheme = (newThemeName) => {
    if (themeMap[newThemeName]) {
      setThemeName(newThemeName);
      localStorage.setItem('app_theme', newThemeName);
    }
  };

  const contextValue = useMemo(() => ({
    setTheme: toggleTheme,
    currentTheme: themeName,
  }), [themeName]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={activeTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

// Custom hook to use our theme context easily
export const useThemeContext = () => useContext(ThemeContext);