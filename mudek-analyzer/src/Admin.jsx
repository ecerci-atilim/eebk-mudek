// src/Admin.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Admin() {
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // This function fetches all users. It requires special permissions.
  async function fetchUsers() {
    setLoading(true);
    // supabase.auth.admin.listUsers() can only be called from a secure server environment,
    // so we will create a Database Function to do this securely.
    const { data, error } = await supabase.rpc('get_all_users');

    if (error) {
      console.error('Error fetching users:', error);
      setError('Could not load users. You may not have permission.');
      setPendingUsers([]);
    } else {
      // Filter for users who are pending approval
      const pending = data.filter(user => user.user_metadata?.status === 'pending');
      setPendingUsers(pending);
    }
    setLoading(false);
  }
  
  useEffect(() => {
    fetchUsers();
  }, [])

  const handleApprove = async (userId) => {
    // Again, we'll create a Database Function for this admin action
    const { error } = await supabase.rpc('approve_user', { user_id_to_update: userId });
    if (error) {
      alert('Failed to approve user: ' + error.message);
    } else {
      alert('User approved!');
      fetchUsers(); // Refresh the list
    }
  }
  
  const handleDeny = async (userId) => {
    if (window.confirm('Are you sure you want to deny and delete this user?')) {
      // And a Database Function for this one too
      const { error } = await supabase.rpc('deny_user', { user_id_to_delete: userId });
      if (error) {
        alert('Failed to deny user: ' + error.message);
      } else {
        alert('User denied and deleted!');
        fetchUsers(); // Refresh the list
      }
    }
  }

  if (loading) return <p>Loading pending users...</p>;
  if (error) return <p style={{color: 'red'}}>{error}</p>;

  return (
    <div>
      <h2>Admin Approval</h2>
      {pendingUsers.length === 0 ? (
        <p>No users are currently pending approval.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Signed Up At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{new Date(user.created_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleApprove(user.id)} style={{backgroundColor: 'green', marginRight: '10px'}}>Approve</button>
                  <button onClick={() => handleDeny(user.id)} style={{backgroundColor: 'red'}}>Deny</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}