import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <div className="text-center mt-10">Loading...</div>
  return user ? children : <Navigate to="/" />
}

export default ProtectedRoute
