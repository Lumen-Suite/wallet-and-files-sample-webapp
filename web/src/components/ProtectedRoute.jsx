import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from './Spinner.jsx'

export default function ProtectedRoute({ children }) {
  const { token, hydrating } = useAuth()
  const location = useLocation()
  if (hydrating) return <Spinner label="Checking sign-in..." />
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
