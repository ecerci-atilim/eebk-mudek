// src/UserManagement.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

import { Box, Typography, Button, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_users');
    if (error) {
      toast.error('Could not load users. You may not have permission.');
    } else {
      setUsers(data.map(user => ({ ...user, id: user.id }))); // Ensure each row has a unique id property
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (action, userId) => {
    const rpcMap = { /* ... same as before ... */ }; // We'll fill this in
    
    // ... same logic but with toast notifications
    const toastId = toast.loading('Performing action...');
    const { error } = await supabase.rpc(action.name, action.params);
    
    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Action successful!', { id: toastId });
      fetchUsers();
    }
  };

  const columns = [
    { field: 'email', headerName: 'Email', flex: 1.5 },
    {
      field: 'status', headerName: 'Status', flex: 1,
      renderCell: (params) => {
        const status = params.row.user_metadata?.status || 'Unknown';
        const role = params.row.user_metadata?.role;
        return (
          <>
            <Chip
              icon={status === 'approved' ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              label={status}
              color={status === 'approved' ? 'success' : 'warning'}
              size="small"
            />
            {role === 'admin' && <Chip label="Admin" color="primary" size="small" sx={{ ml: 1 }} />}
          </>
        );
      },
    },
    { field: 'last_sign_in_at', headerName: 'Last Sign In', flex: 1, type: 'dateTime', valueGetter: (params) => new Date(params.value) },
    {
      field: 'actions', headerName: 'Actions', flex: 2, sortable: false, filterable: false,
      renderCell: (params) => {
        const user = params.row;
        const isPending = user.user_metadata?.status === 'pending';
        const isAdmin = user.user_metadata?.role === 'admin';
        const isSelf = user.id === currentUser.id;

        const performAction = async (actionName, params) => {
          const toastId = toast.loading('Processing...');
          const { error } = await supabase.rpc(actionName, params);
          if (error) toast.error(error.message, { id: toastId });
          else { toast.success('Action successful!', { id: toastId }); fetchUsers(); }
        };

        return (
          <Box>
            {isPending && <Button size="small" variant="contained" color="success" onClick={() => performAction('approve_user', { user_id_to_update: user.id })}>Approve</Button>}
            {!isSelf && (
              <>
                {isAdmin ?
                  <Button size="small" sx={{ ml: 1 }} onClick={() => performAction('update_user_role', { p_user_id: user.id, p_role: null })}>Revoke Admin</Button> :
                  <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => performAction('update_user_role', { p_user_id: user.id, p_role: 'admin' })}>Make Admin</Button>
                }
                <Button size="small" variant="outlined" color="error" sx={{ ml: 1 }} startIcon={<DeleteForeverIcon />} onClick={() => { if(window.confirm('Delete user permanently?')) performAction('deny_user', { user_id_to_delete: user.id })}}>Delete</Button>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Typography variant="h4" gutterBottom>User Management</Typography>
      <DataGrid
        rows={users}
        columns={columns}
        loading={loading}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[10, 25, 50]}
        autoHeight
      />
    </Box>
  );
}