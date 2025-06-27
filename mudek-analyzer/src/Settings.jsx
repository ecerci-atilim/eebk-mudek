// src/Settings.jsx

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';
import { useThemeContext, themeMap } from './ThemeContext';

import { 
  Box, Typography, Paper, TextField, Button, Grid, CircularProgress, 
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel 
} from '@mui/material';

export default function Settings() {
  const { setTheme, currentTheme } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setFullName(user?.user_metadata?.full_name || '');
      setEmail(user?.email || '');
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Updating profile...');
    const { error: nameError } = await supabase.rpc('update_user_full_name', { new_full_name: fullName });
    if (nameError) {
      toast.error(`Profile update failed: ${nameError.message}`, { id: toastId });
      return;
    }
    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: email });
      if (emailError) {
        toast.error(`Email update failed: ${emailError.message}`, { id: toastId });
        return;
      }
      toast.success('Confirmation email sent to your new address!', { id: toastId, duration: 6000 });
    } else {
      toast.success('Profile updated successfully!', { id: toastId });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters long.");

    const toastId = toast.loading('Updating password...');
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
      toast.error(`Password update failed: ${error.message}`, { id: toastId });
    } else {
      toast.success('Password updated successfully!', { id: toastId });
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleRequestDeletion = async () => {
    if (!window.confirm("Are you sure you want to request account deletion? This action will flag your account for permanent removal by an administrator.")) return;

    const toastId = toast.loading('Submitting deletion request...');
    const { error } = await supabase.auth.updateUser({
      data: { status: 'deletion_requested' }
    });
    if (error) {
      toast.error(`Failed to submit request: ${error.message}`, { id: toastId });
    } else {
      toast.success('Your account has been flagged for deletion.', { id: toastId, duration: 5000 });
      await supabase.auth.signOut();
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Account Settings</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Profile Information</Typography>
            <Box component="form" onSubmit={handleUpdateProfile}>
              <TextField fullWidth label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" helperText="A confirmation link will be sent if you change your email."/>
              <TextField fullWidth label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} margin="normal"/>
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save Profile</Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Change Password</Typography>
            <Box component="form" onSubmit={handleUpdatePassword}>
              <TextField fullWidth label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" helperText="Must be at least 6 characters."/>
              <TextField fullWidth label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} margin="normal"/>
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>Update Password</Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Appearance</Typography>
            <FormControl>
              <FormLabel id="theme-radio-buttons-group-label">Theme</FormLabel>
              <RadioGroup row aria-labelledby="theme-radio-buttons-group-label" name="theme-radio-buttons-group" value={currentTheme} onChange={(e) => setTheme(e.target.value)}>
                {Object.keys(themeMap).map(themeName => (
                  <FormControlLabel key={themeName} value={themeName} control={<Radio />} label={themeName.charAt(0).toUpperCase() + themeName.slice(1)}/>
                ))}
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, border: 1, borderColor: 'error.main' }}>
            <Typography variant="h6" gutterBottom color="error">Danger Zone</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" fontWeight="bold">Delete This Account</Typography>
                <Typography variant="body2">Once your deletion request is approved, your account and all associated data will be permanently removed. This action cannot be undone.</Typography>
              </Box>
              <Button variant="contained" color="error" onClick={handleRequestDeletion} disabled={user?.user_metadata?.status === 'deletion_requested'}>
                {user?.user_metadata?.status === 'deletion_requested' ? 'Request Pending' : 'Request Account Deletion'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}