// src/UserManagement.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// A small component to display user status clearly
const UserStatus = ({ metadata }) => {
  const status = metadata?.status || 'Unknown';
  const role = metadata?.role || 'User';

  return (
    <div>
      <span style={{
        padding: '2px 6px', borderRadius: '4px', color: 'white',
        backgroundColor: status === 'approved' ? 'green' : (status === 'pending' ? 'orange' : 'grey')
      }}>
        {status}
      </span>
      {role === 'admin' && (
        <span style={{
          marginLeft: '8px', padding: '2px 6px', borderRadius: '4px',
          color: 'white', backgroundColor: '#007bff'
        }}>
          Admin
        </span>
      )}
    </div>
  );
};

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const currentUserId = supabase.auth.getUser().id; // Get the current admin's ID

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_users');
    if (error) {
      setError('Could not load users. You may not have permission.');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }
  
  useEffect(() => {
    fetchUsers();
  }, [])

  // Action Handlers
  const handleAction = async (action, userId, payload) => {
    const rpcMap = {
      'approve': { name: 'approve_user', params: { user_id_to_update: userId } },
      'delete': { name: 'deny_user', params: { user_id_to_delete: userId } },
      'ban': { name: 'ban_user_by_id', params: { p_user_id: userId } },
      'makeAdmin': { name: 'update_user_role', params: { p_user_id: userId, p_role: 'admin' } },
      'revokeAdmin': { name: 'update_user_role', params: { p_user_id: userId, p_role: null } },
    };

    if (!rpcMap[action]) return;

    if (action === 'delete' && !window.confirm('Are you sure you want to PERMANENTLY DELETE this user?')) return;
    if (action === 'ban' && !window.confirm('Are you sure you want to BAN this user?')) return;
    
    const { name, params } = rpcMap[action];
    const { error } = await supabase.rpc(name, params);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert('Action successful!');
      fetchUsers(); // Refresh the user list
    }
  }

  if (loading) return <p>Loading user data...</p>;
  if (error) return <p style={{color: 'red'}}>{error}</p>;

  return (
    <div>
      <h2>User Management</h2>
      <p>Manage all users in the system.</p>
      <table style={{ tableLayout: 'auto', width: '100%' }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Status / Role</th>
            <th>Last Sign In</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td><UserStatus metadata={user.user_metadata} /></td>
              <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</td>
              <td>
                {user.user_metadata?.status === 'pending' && (
                  <button onClick={() => handleAction('approve', user.id)} style={{backgroundColor: 'green'}}>Approve</button>
                )}
                {user.id !== currentUserId && ( // Prevent admin from acting on themselves
                  <>
                    {user.user_metadata?.role !== 'admin' ? (
                      <button onClick={() => handleAction('makeAdmin', user.id)} style={{backgroundColor: 'blue', marginLeft: '5px'}}>Make Admin</button>
                    ) : (
                      <button onClick={() => handleAction('revokeAdmin', user.id)} style={{backgroundColor: 'orange', marginLeft: '5px'}}>Revoke Admin</button>
                    )}
                    <button onClick={() => handleAction('ban', user.id)} style={{backgroundColor: 'purple', marginLeft: '5px'}}>Ban</button>
                    <button onClick={() => handleAction('delete', user.id)} style={{backgroundColor: 'red', marginLeft: '5px'}}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}