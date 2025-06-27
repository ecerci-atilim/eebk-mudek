// src/themes.js

import { createTheme } from '@mui/material/styles';
import { red, pink, purple, deepPurple, indigo, blue, green, amber } from '@mui/material/colors';

// This is your base "Light" theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: indigo,
    secondary: pink,
  },
});

// This is your base "Dark" theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: amber[300],
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    }
  },
});

// A custom theme with a different primary color
export const blueTheme = createTheme({
  palette: {
    mode: 'light',
    primary: blue,
    secondary: red,
  },
});

// Another custom theme
export const purpleTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: purple[400],
    },
    secondary: {
      main: green['A200'],
    },
    background: {
      default: deepPurple[900],
      paper: deepPurple[800],
    }
  },
});