// src/App.jsx

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Box, CircularProgress } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from './ThemeContext'; // Use our custom provider
import Auth from './Auth';
import Layout from './Layout';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
import Settings from './Settings';

function ProtectedRoute({ session, children }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ session, children }) {
  const isAuthorized = ['admin', 'owner'].includes(session?.user?.user_metadata?.role);
  if (!session || !isAuthorized) {
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
    <ThemeProvider>
      <BrowserRouter>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/login" element={<Auth />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute session={session}>
                <Layout onSignOut={handleSignOut} session={session}>
                  <Outlet />
                </Layout>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard session={session} />} />
            <Route 
              path="users" 
              element={
                <AdminRoute session={session}>
                  <UserManagement />
                </AdminRoute>
              } 
            />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to={session ? "/" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;