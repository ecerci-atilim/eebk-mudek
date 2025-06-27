// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Auth from './Auth';
import Layout from './Layout';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';

const theme = createTheme(); // Use the default MUI theme

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
    return <div>Loading...</div>; // Or a nice spinner component
  }
  
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {!session ? (
          <Auth />
        ) : (
          <Layout onSignOut={handleSignOut}>
            <Routes>
              <Route path="/" element={<Dashboard session={session} />} />
              {session.user?.user_metadata?.role === 'admin' && (
                 <Route path="/users" element={<UserManagement />} />
              )}
              {/* Redirect any unknown paths to the dashboard */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        )}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;