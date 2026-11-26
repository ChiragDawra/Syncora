import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { FullPageSpinner } from '../common/Spinner';

// While the session is being restored show a spinner, so a refresh doesn't flash the login page
export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') return <FullPageSpinner label="Checking your session" />;
  if (status === 'anonymous') return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
