// src/App.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'
import UserManagement from './UserManagement'
//import Admin from './Admin' // Import the new component

function App() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'admin'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      // Check for admin role on initial load
      setIsAdmin(session?.user?.user_metadata?.role === 'admin');
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      // Check for admin role on any auth change
      setIsAdmin(session?.user?.user_metadata?.role === 'admin');
      setView('dashboard'); // Reset to dashboard view on login/logout
    })

    return () => subscription.unsubscribe()
  }, [])

  // Helper to render the main content
  const renderContent = () => {
    if (view === 'user_management' && isAdmin) {
    return <UserManagement />;
  }
    // Default to dashboard
    return <Dashboard key={session.user.id} session={session} />;
  }

  return (
    <div className="container">
      {!session ? (
        <Auth />
      ) : (
        <div>
          {/* Admin Navigation */}
          {isAdmin && (
        <div style={{marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee'}}>
          <button onClick={() => setView('dashboard')} disabled={view === 'dashboard'}>Dashboard</button>
          {/* CHANGE THE VIEW NAME AND THE BUTTON TEXT */}
          <button onClick={() => setView('user_management')} disabled={view === 'user_management'} style={{marginLeft: '10px'}}>Manage Users</button>
        </div>
        )}
          {/* Main Content Area */}
          {renderContent()}
        </div>
      )}
    </div>
  )
}

export default App