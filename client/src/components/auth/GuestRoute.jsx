import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { FullPageSpinner } from '../common/Spinner';

// Login and register pages: logged-in users go straight to their teams
export default function GuestRoute({ children }) {
  const { status } = useAuth();
  if (status === 'checking') return <FullPageSpinner label="Checking your session" />;
  if (status === 'authenticated') return <Navigate to="/teams" replace />;
  return children;
}
