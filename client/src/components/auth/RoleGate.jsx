import useTeam from '../../hooks/useTeam';
import ErrorState from '../common/ErrorState';

export default function RoleGate({ roles, children, fallback }) {
  const { myRole, team } = useTeam();
  if (roles.includes(myRole)) return children;
  return fallback ?? <ErrorState title="You don't have access to this page" message="Ask the team owner or an admin." backTo={`/teams/${team._id}`} />;
}
