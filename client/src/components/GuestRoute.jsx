import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  }

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'landlord') return <Navigate to="/landlord/dashboard" replace />
    return <Navigate to="/" replace />
  }

  return children
}

export default GuestRoute
