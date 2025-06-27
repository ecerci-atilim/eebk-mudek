// src/Auth.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

import { 
  Button, TextField, Box, Typography, Container, Paper, Link as MuiLink,
  IconButton, InputAdornment, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import SchoolIcon from '@mui/icons-material/School'; // Placeholder for your logo

export default function Auth() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State for new features
  const [showPassword, setShowPassword] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    // Step 1: Sign in with password. This only verifies the password.
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      toast.error(signInError.error_description || signInError.message);
      setLoading(false);
      return;
    }

    // Step 2: THIS IS THE FIX. After a successful sign-in, immediately fetch the
    // user's full, up-to-date profile from the database.
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Step 3: Now check the status on the fresh user data.
      if (user.user_metadata?.status !== 'approved') {
        await supabase.auth.signOut(); // Ensure they are fully logged out
        toast.error('Your account is pending approval from an administrator.');
      } else {
        toast.success('Signed in successfully!');
        navigate('/'); // Navigate to dashboard
      }
    }
    setLoading(false);
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { status: 'pending' } }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Sign-up successful! An administrator will review your request.');
      //setIsLoginView(true);
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin, // URL to redirect to after password reset
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset link sent! Please check your email.');
      setOpenResetDialog(false);
    }
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Logo Placeholder */}
        <Box sx={{ mb: 2 }}>
          <SchoolIcon color="primary" sx={{ fontSize: 60 }} />
        </Box>

        <Typography component="h1" variant="h5">
          {isLoginView ? 'Sign In' : 'Sign Up'}
        </Typography>
        <Typography component="p" variant="subtitle1" sx={{ mt: 1, color: 'text.secondary' }}>
          MUDEK Analysis Tool
        </Typography>

        <Box component="form" onSubmit={isLoginView ? handleLogin : handleSignup} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal" required fullWidth id="email" label="Email Address" name="email"
            autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal" required fullWidth name="password" label="Password"
            type={showPassword ? 'text' : 'password'} id="password"
            autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2 }}>
            {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <MuiLink component="button" variant="body2" onClick={() => setOpenResetDialog(true)}>
              Forgot password?
            </MuiLink>
            <MuiLink component="button" variant="body2" onClick={() => setIsLoginView(!isLoginView)}>
              {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </MuiLink>
          </Box>
        </Box>
      </Paper>
      
      {/* Password Reset Dialog (Modal) */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter your email address below and we will send you a link to reset your password.
          </DialogContentText>
          <TextField
            autoFocus margin="dense" id="reset-email" label="Email Address" type="email"
            fullWidth variant="standard" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordReset} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}