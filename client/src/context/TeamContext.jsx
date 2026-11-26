import { createContext, useCallback, useEffect, useMemo } from 'react';
import { getTeam } from '../api/teams';
import useFetch from '../hooks/useFetch';
import useWorkspace from '../hooks/useWorkspace';
import { can as canDo } from '../utils/permissions';
import { FullPageSpinner } from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';

export const TeamContext = createContext(null);

// Loads one team and exposes { team, myRole, can(action), refetchTeam } to everything inside it,
// so the role is not prop-drilled through layout -> page -> column -> card.
export function TeamProvider({ teamId, children }) {
  const { data, loading, error, refetch } = useFetch((cfg) => getTeam(teamId, cfg), [teamId]);
  const { setTeamId, refreshWorkspace } = useWorkspace();
  const team = data?.team;
  const myRole = team?.myRole || null;

  // the sidebar follows the team being viewed
  useEffect(() => {
    if (team?._id) setTeamId(team._id);
  }, [team?._id, setTeamId]);

  const refetchTeam = useCallback(
    (opts) => {
      refetch(opts);
      refreshWorkspace();
    },
    [refetch, refreshWorkspace]
  );

  const can = useCallback((action) => canDo(myRole, action), [myRole]);
  const value = useMemo(() => ({ team, myRole, can, refetchTeam }), [team, myRole, can, refetchTeam]);

  if (loading && !team) return <FullPageSpinner label="Loading team" />;
  if (error) {
    return (
      <ErrorState
        title={error.status === 403 ? "You don't have access to this team" : error.status === 404 ? 'Team not found' : 'Could not load the team'}
        message={error.message}
        onRetry={error.status >= 500 || !error.status ? refetch : undefined}
        backTo="/teams"
      />
    );
  }
  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}
