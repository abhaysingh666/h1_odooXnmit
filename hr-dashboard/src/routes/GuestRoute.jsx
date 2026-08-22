import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageSpinner from '../components/ui/PageSpinner';

export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageSpinner />;

  if (isAuthenticated) {
    return <Navigate to="/employees" replace />;
  }

  return <Outlet />;
}
