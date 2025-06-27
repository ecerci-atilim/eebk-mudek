// src/Layout.jsx

import { Link as RouterLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppBar, Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

export default function Layout({ children, onSignOut, session }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* The Toaster component was correctly moved to App.jsx */}

      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            MUDEK
          </Typography>
          <Button color="inherit" onClick={onSignOut}>
            Sign Out
          </Button>
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
            
            {['admin', 'owner'].includes(session?.user?.user_metadata?.role) && (
              <ListItem disablePadding component={RouterLink} to="/users" sx={{color: 'inherit', textDecoration: 'none'}}>
                <ListItemButton>
                  <ListItemIcon><PeopleIcon /></ListItemIcon>
                  <ListItemText primary="Manage Users" />
                </ListItemButton>
              </ListItem>
            )}

            <ListItem disablePadding component={RouterLink} to="/settings" sx={{color: 'inherit', textDecoration: 'none'}}>
              <ListItemButton>
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="My Account" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f4f6f8' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}