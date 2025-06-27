// src/UserManagement.jsx

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

import { Box, Typography, Button, Chip, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // This is the function that will fetch all data
  const fetchData = async () => {
    setLoading(true);

    // Step 1: Get the current user's data first
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      toast.error("Could not verify your session. Please log in again.");
      setLoading(false);
      return;
    }
    setCurrentUser(authUser);

    // Step 2: Now fetch the list of all users
    const { data: allUsers, error: rpcError } = await supabase.rpc('get_all_users');
    
    if (rpcError) {
      toast.error(`Failed to load users: ${rpcError.message}`);
      setUsers([]);
    } else {
      setUsers(allUsers.map(u => ({ ...u, id: u.id })));
    }

    setLoading(false);
  };

  // The useEffect hook simply calls our fetchData function once
  useEffect(() => {
    fetchData();
  }, []); // The empty array [] means this runs only once when the component mounts

  const performAction = async (actionName, params) => {
    const toastId = toast.loading('Processing...');
    const { error } = await supabase.rpc(actionName, params);
    if (error) {
      toast.error(error.message, { id: toastId });
    } else {
      toast.success('Action successful!', { id: toastId });
      await fetchData(); // Refresh the grid after a successful action
    }
  };

  const columns = [
    { field: 'email', headerName: 'Email', flex: 1.5 },
    {
      field: 'status', headerName: 'Status', flex: 1,
      renderCell: ({ row }) => {
        const status = row.user_metadata?.status || 'Unknown';
        const role = row.user_metadata?.role;
        return (
          <>
            <Chip icon={status === 'approved' ? <CheckCircleIcon /> : <HourglassEmptyIcon />} label={status} color={status === 'approved' ? 'success' : 'warning'} size="small" />
            {role === 'admin' && <Chip label="Admin" color="primary" size="small" sx={{ ml: 1 }} />}
          </>
        );
      },
    },
    { field: 'last_sign_in_at', headerName: 'Last Sign In', flex: 1, type: 'dateTime', valueGetter: (value) => value ? new Date(value) : null },
    {
      field: 'actions', headerName: 'Actions', flex: 2, sortable: false, filterable: false,
      renderCell: ({ row }) => {
        const isPending = row.user_metadata?.status === 'pending';
        const isAdmin = row.user_metadata?.role === 'admin';
        const isSelf = row.id === currentUser?.id;

        return (
          <Box>
            {isPending && <Button size="small" variant="contained" color="success" onClick={() => performAction('approve_user', { user_id_to_update: row.id })}>Approve</Button>}
            {!isSelf && (
              <>
                {isAdmin ?
                  <Button size="small" variant="outlined" color="warning" sx={{ ml: 1 }} onClick={() => performAction('update_user_role', { p_user_id: row.id, p_role: null })}>Revoke Admin</Button> :
                  <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => performAction('update_user_role', { p_user_id: row.id, p_role: 'admin' })}>Make Admin</Button>
                }
                <Button size="small" variant="outlined" color="error" sx={{ ml: 1 }} startIcon={<DeleteForeverIcon />} onClick={() => { if(window.confirm('Delete user permanently?')) performAction('deny_user', { user_id_to_delete: row.id })}}>Delete</Button>
              </>
            )}
          </Box>
        );
      },
    },
  ];
  
  // New: Render a loading spinner while data is being fetched
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'auto', width: '100%' }}>
      <Typography variant="h4" gutterBottom>User Management</Typography>
      <Box sx={{ height: 650, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
}