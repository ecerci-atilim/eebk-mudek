// src/UserManagement.jsx

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

import { Box, Typography, Button, Chip, CircularProgress, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setCurrentUser(authUser);

    const { data: allUsers, error: rpcError } = await supabase.rpc('get_all_users');
    if (rpcError) {
      toast.error(`Failed to load users: ${rpcError.message}`);
      setUsers([]);
    } else {
      setUsers(allUsers.map(u => ({ ...u, id: u.id })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const performAction = async (actionName, params) => {
    const toastId = toast.loading('Processing...');
    const { error } = await supabase.rpc(actionName, params);
    if (error) {
      toast.error(error.message, { id: toastId });
    } else {
      toast.success('Action successful!', { id: toastId });
      await fetchData();
    }
  };

  const columns = [
    { field: 'email', headerName: 'Email', flex: 1.5 },
    {
      field: 'status', headerName: 'Status', flex: 1,
      renderCell: ({ row }) => {
        const status = row.user_metadata?.status || 'Unknown';
        const role = row.user_metadata?.role;
        const isBanned = row.banned_until && new Date(row.banned_until) > new Date();
        
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={status === 'approved' ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              label={status}
              color={status === 'approved' ? 'success' : 'warning'}
              size="small"
            />
            {role === 'admin' && <Chip label="Admin" color="primary" size="small" />}
            {isBanned && <Chip label="Banned" color="error" size="small" icon={<LockIcon />} />}
          </Box>
        );
      },
    },
    { field: 'last_sign_in_at', headerName: 'Last Sign In', flex: 1, type: 'dateTime', valueGetter: (value) => value ? new Date(value) : null },
    {
      field: 'actions', headerName: 'Actions', flex: 2.5, sortable: false, filterable: false,
      renderCell: ({ row }) => {
        const user = row;
        const isPending = user.user_metadata?.status === 'pending';
        const isAdmin = user.user_metadata?.role === 'admin';
        const isSelf = user.id === currentUser?.id;
        const isBanned = user.banned_until && new Date(user.banned_until) > new Date();

        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isPending && <Button size="small" variant="contained" color="success" onClick={() => performAction('approve_user', { user_id_to_update: user.id })}>Approve</Button>}
            
            {!isSelf && (
              <>
                {isAdmin ? (
                  <Tooltip title="Remove admin privileges from this user">
                    <Button size="small" variant="outlined" color="warning" onClick={() => performAction('update_user_role', { p_user_id: user.id, p_role: null })}>Revoke Admin</Button>
                  </Tooltip>
                ) : (
                  <Tooltip title="Grant admin privileges to this user">
                    <Button size="small" variant="outlined" onClick={() => performAction('update_user_role', { p_user_id: user.id, p_role: 'admin' })}>Make Admin</Button>
                  </Tooltip>
                )}

                {isBanned ? (
                  <Tooltip title="Allow this user to sign in again">
                    <Button size="small" variant="outlined" color="success" startIcon={<LockOpenIcon />} onClick={() => performAction('unban_user_by_id', { p_user_id: user.id })}>Unban</Button>
                  </Tooltip>
                ) : (
                  <Tooltip title="Prevent this user from signing in">
                    <Button size="small" variant="outlined" color="secondary" startIcon={<LockIcon />} onClick={() => { if(window.confirm('Are you sure you want to ban this user?')) performAction('ban_user_by_id', { p_user_id: user.id })}}>Ban</Button>
                  </Tooltip>
                )}

                <Tooltip title="Permanently delete this user. This cannot be undone.">
                  <Button size="small" variant="outlined" color="error" startIcon={<DeleteForeverIcon />} onClick={() => { if(window.confirm('Delete user permanently? This cannot be undone.')) performAction('deny_user', { user_id_to_delete: user.id })}}>Delete</Button>
                </Tooltip>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  const fetchDataAndRefresh = async () => {
    await fetchData();
  };
  
  // Need to get the full user object including banned_until
  // so we need to modify the get_all_users function one last time
  // I will assume you have done this based on the instructions below.
  if (loading) return <CircularProgress />;

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