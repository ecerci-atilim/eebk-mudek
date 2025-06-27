// src/UserManagement.jsx

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

import { Box, Typography, Button, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Step 1: Get the current logged-in user's data
      const { data: { user: currentAuthUser }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        toast.error('Could not get your user session.');
        setLoading(false);
        return;
      }
      setCurrentUser(currentAuthUser);

      // Step 2: Fetch the list of all users using the RPC function
      const { data: allUsersData, error: rpcError } = await supabase.rpc('get_all_users');
      if (rpcError) {
        toast.error('Could not load users. You may not have permission.');
        setUsers([]);
      } else {
        // Ensure each row has a unique id property for the DataGrid
        setUsers(allUsersData.map(user => ({ ...user, id: user.id })));
      }
      
      setLoading(false);
    }

    fetchData();
  }, []); // The empty array ensures this runs only once on mount

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
    { 
      field: 'last_sign_in_at', 
      headerName: 'Last Sign In', 
      flex: 1, 
      type: 'dateTime', 
      valueGetter: (value) => value ? new Date(value) : null 
    },
    {
      field: 'actions', headerName: 'Actions', flex: 2, sortable: false, filterable: false,
      renderCell: (params) => {
        const user = params.row;
        const isPending = user.user_metadata?.status === 'pending';
        const isAdmin = user.user_metadata?.role === 'admin';
        const isSelf = user.id === currentUser?.id; // Corrected line with optional chaining

        const performAction = async (actionName, params) => {
          const toastId = toast.loading('Processing...');
          const { error } = await supabase.rpc(actionName, params);
          if (error) {
            toast.error(error.message, { id: toastId });
          } else {
            toast.success('Action successful!', { id: toastId });
            // Re-fetch all data to update the grid
            await fetchData(); 
          }
        };

        const fetchData = async () => {
          setLoading(true);
          const { data, error } = await supabase.rpc('get_all_users');
          if (error) {
            toast.error('Could not refresh users list.');
          } else {
            setUsers(data.map(user => ({ ...user, id: user.id })));
          }
          setLoading(false);
        };

        return (
          <Box>
            {isPending && <Button size="small" variant="contained" color="success" onClick={() => performAction('approve_user', { user_id_to_update: user.id })}>Approve</Button>}
            {!isSelf && (
              <>
                {isAdmin ?
                  <Button size="small" variant="outlined" color="warning" sx={{ ml: 1 }} onClick={() => performAction('update_user_role', { p_user_id: user.id, p_role: null })}>Revoke Admin</Button> :
                  <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => performAction('update_user_role', { p_user_id: user.id, p_role: 'admin' })}>Make Admin</Button>
                }
                <Button size="small" variant="outlined" color="error" sx={{ ml: 1 }} startIcon={<DeleteForeverIcon />} onClick={() => { if(window.confirm('Delete user permanently? This cannot be undone.')) performAction('deny_user', { user_id_to_delete: user.id })}}>Delete</Button>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ height: 'auto', width: '100%' }}>
      <Typography variant="h4" gutterBottom>User Management</Typography>
      <Box sx={{ height: 650, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
}