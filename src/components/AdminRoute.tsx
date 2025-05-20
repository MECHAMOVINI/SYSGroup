import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AdminRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    // Optionally, return a loading spinner or null while auth state is loading
    return null; 
  }

  // Redirect to admin login if not authenticated or not an admin
  // We assume the admin login page is at /admin-login (created previously)
  // If an admin is already logged in, user.type will be 'admin'
  // If a company is logged in, user.type will be 'empresa', and they should not access /admin
  if (!user || user.type !== 'admin') {
    return <Navigate to="/admin-login" replace />
  }

  return <Outlet />
} 