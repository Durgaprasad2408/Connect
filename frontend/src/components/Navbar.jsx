import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/feed" className="text-xl font-bold text-blue-600">LinkedLite</Link>
        <div className="flex gap-4 items-center">
          {user && (
            <>
              <Link to={`/profile/${user.id}`} className="font-medium">{user.name}</Link>
              <button onClick={handleLogout} className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
