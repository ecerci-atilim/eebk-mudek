// src/Auth.jsx
import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    // Standard Login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.error_description || error.message);
    } else if (data.user) {
      // Check for our custom 'approved' status
      if (data.user.user_metadata?.status !== 'approved') {
        // Log them out immediately if not approved
        await supabase.auth.signOut();
        setMessage('Your account is pending approval from an administrator.');
      }
      // If approved, the main App.jsx will handle the successful session
    }
    setLoading(false)
  }

  const handleSignup = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    // Sign up with custom metadata to mark the user as 'pending'
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          status: 'pending', // This is our custom approval flag
          full_name: 'New User' // You can add other fields here
        }
      }
    })

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Sign-up successful! An administrator will review your request.');
    }
    setLoading(false)
  }

  return (
    <div>
      <h1>MUDEK Analysis Tool</h1>
      <p>{isLoginView ? 'Sign in to continue' : 'Request access by signing up'}</p>
      
      <form onSubmit={isLoginView ? handleLogin : handleSignup}>
        <label htmlFor="email">Email</label>
        <input
          id="email" type="email" placeholder="Your email" value={email}
          required={true} onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password" type="password" placeholder="Your password" value={password}
          required={true} onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : (isLoginView ? 'Sign In' : 'Sign Up')}
        </button>
      </form>
      
      {message && <p style={{color: 'blue', marginTop: '15px'}}>{message}</p>}

      <button onClick={() => {setIsLoginView(!isLoginView); setMessage('')}} style={{marginTop: '20px', backgroundColor: 'grey'}}>
        {isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
      </button>
    </div>
  )
}