import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoMark } from './Logo';

/**
 * Route guard. Handles three concerns, in order:
 *   1. Not signed in            -> /login (remembering where they were headed)
 *   2. Still on the temporary
 *      admin-issued password    -> /change-password (forced)
 *   3. Insufficient role        -> back to their own dashboard
 */
export default function ProtectedRoute({ children, requireAdmin = false, allowFirstLogin = false }) {
  const { user, loading, mustChangePassword, homePath } = useAuth();
  const location = useLocation();

  if (loading) return <RouteLoader />;

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // A first-login user holds a password their admin generated and can read.
  // Gate the whole app until they replace it.
  if (mustChangePassword && !allowFirstLogin) {
    return <Navigate to="/change-password" replace state={{ forced: true }} />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to={homePath} replace />;
  }

  return children;
}

/** Full-page loader shown while the session is verified against /api/auth/me. */
export function RouteLoader({ label = 'Checking your session…' }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-background p-6">
      <div className="flex animate-fade-in flex-col items-center gap-5">
        <div className="relative grid place-items-center">
          <span className="absolute size-16 animate-ping rounded-2xl bg-primary/20" />
          <LogoMark size="xl" className="relative" />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium">Dayflow HRMS</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-[shimmer_1.2s_linear_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

/**
 * Inverse guard for /login and /complete-registration — an already
 * authenticated user shouldn't see them.
 */
export function PublicOnlyRoute({ children }) {
  const { user, loading, homePath, mustChangePassword } = useAuth();

  if (loading) return <RouteLoader />;

  if (user) {
    return <Navigate to={mustChangePassword ? '/change-password' : homePath} replace />;
  }

  return children;
}
