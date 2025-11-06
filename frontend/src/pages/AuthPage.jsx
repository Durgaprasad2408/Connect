import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const AuthPage = () => {
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { user, login, signup, loading } = useContext(AuthContext)
  const navigate = useNavigate()

  // Auto-redirect logged-in users to feed
  useEffect(() => {
    if (!loading && user) {
      navigate('/feed', { replace: true })
    }
  }, [user, loading, navigate])

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  // Don't render auth form if user is already logged in
  if (user) {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isSignup) await signup(form.name, form.email, form.password)
      else await login(form.email, form.password)
      navigate('/feed')
    } catch (err) {
      alert('Authentication failed')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>
        {isSignup && (
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2 border rounded mb-4"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 border rounded mb-4"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 border rounded mb-4"
          required
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {isSignup ? 'Sign Up' : 'Log In'}
        </button>
        <p className="text-center text-sm mt-4">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 ml-1 hover:underline"
          >
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  )
}

export default AuthPage
