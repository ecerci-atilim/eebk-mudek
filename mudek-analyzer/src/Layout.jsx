// src/Layout.jsx
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppBar, Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';

const drawerWidth = 240;

export default function Layout({ onSignOut }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Toaster position="top-center" reverseOrder={false} />

      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            MUDEK Analysis Tool
          </Typography>
          <button onClick={onSignOut} style={{ color: 'white', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
            Sign Out
          </button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem disablePadding component={RouterLink} to="/" sx={{color: 'inherit', textDecoration: 'none'}}>
              <ListItemButton>
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding component={RouterLink} to="/users" sx={{color: 'inherit', textDecoration: 'none'}}>
              <ListItemButton>
                <ListItemIcon><PeopleIcon /></ListItemIcon>
                <ListItemText primary="Manage Users" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet /> {/* This is where our page components will be rendered */}
      </Box>
    </Box>
  );
}