// src/App.jsx

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { ThemeProvider, createTheme, Box, CircularProgress } from '@mui/material';

import Auth from './Auth';
import Layout from './Layout';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';

const theme = createTheme();

// A helper component to wrap our protected routes
function ProtectedRoute({ session, children }) {
  if (!session) {
    // If no session, redirect to the login page
    return <Navigate to="/login" replace />;
  }
  // If there is a session, render the children components
  return children;
}

// A specific helper for admin-only routes
function AdminRoute({ session, children }) {
  const isAdmin = session?.user?.user_metadata?.role === 'admin';
  if (!session || !isAdmin) {
    // If not an admin, redirect to the dashboard
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Public Route: The Login Page */}
          <Route path="/login" element={<Auth />} />
          
          {/* Protected Routes: All pages inside the layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute session={session}>
                <Layout onSignOut={handleSignOut} session={session}>
                  <Outlet /> {/* The Outlet now lives here */}
                </Layout>
              </ProtectedRoute>
            }
          >
            {/* These are the child routes that will be rendered inside the Layout's Outlet */}
            <Route index element={<Dashboard session={session} />} />
            <Route 
              path="users" 
              element={
                <AdminRoute session={session}>
                  <UserManagement />
                </AdminRoute>
              } 
            />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to={session ? "/" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;