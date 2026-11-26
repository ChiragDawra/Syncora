import { createContext, useCallback, useMemo, useState } from 'react';

export const WorkspaceContext = createContext(null);

const read = () => {
  try {
    return localStorage.getItem('lastTeamId');
  } catch {
    return null;
  }
};

// Which team the sidebar shows, plus a version number the sidebar refetches on
// (bumped after a board or team changes). Per-browser convenience only.
export function WorkspaceProvider({ children }) {
  const [teamId, setTeamIdState] = useState(read);
  const [version, setVersion] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setTeamId = useCallback((id) => {
    setTeamIdState(id);
    try {
      if (id) localStorage.setItem('lastTeamId', id);
      else localStorage.removeItem('lastTeamId');
    } catch {
      /* storage blocked: the sidebar just forgets the team */
    }
  }, []);

  const refreshWorkspace = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo(
    () => ({ teamId, setTeamId, version, refreshWorkspace, drawerOpen, setDrawerOpen }),
    [teamId, setTeamId, version, refreshWorkspace, drawerOpen]
  );
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
