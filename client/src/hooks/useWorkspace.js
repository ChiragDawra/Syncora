import { useContext } from 'react';
import { WorkspaceContext } from '../context/WorkspaceContext';

const fallback = { teamId: null, setTeamId: () => {}, version: 0, refreshWorkspace: () => {}, drawerOpen: false, setDrawerOpen: () => {} };

// Safe outside the provider (returns no-ops), so components work in any layout
export default function useWorkspace() {
  return useContext(WorkspaceContext) || fallback;
}
