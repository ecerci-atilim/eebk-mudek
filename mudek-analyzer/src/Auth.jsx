// src/Auth.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import the hook
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

import { Button, TextField, Box, Typography, Container, Paper, Link as MuiLink } from '@mui/material';

export default function Auth() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Get the navigate function

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.error_description || error.message);
    } else if (data.user) {
      if (data.user.user_metadata?.status !== 'approved') {
        await supabase.auth.signOut(); // Ensure they are fully logged out
        toast.error('Your account is pending approval from an administrator.');
      } else {
        // THIS IS THE FIX: Navigate to the dashboard on successful, approved login
        toast.success('Signed in successfully!');
        navigate('/');
      }
    }
    setLoading(false);
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          status: 'pending',
          full_name: 'New User'
        }
      }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Sign-up successful! An administrator will review your request.');
      // Switch to the login view so they don't sign up again
      setIsLoginView(true);
    }
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          {isLoginView ? 'Sign In' : 'Sign Up'}
        </Typography>
        <Typography component="p" variant="subtitle1" sx={{ mt: 1 }}>
          MUDEK Analysis Tool
        </Typography>

        <Box component="form" onSubmit={isLoginView ? handleLogin : handleSignup} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
          </Button>

          <MuiLink
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              setIsLoginView(!isLoginView);
            }}
          >
            {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </MuiLink>
        </Box>
      </Paper>
    </Container>
  );
}