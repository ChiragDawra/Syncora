import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useFetch from '../hooks/useFetch';
import useWorkspace from '../hooks/useWorkspace';
import { listTeams } from '../api/teams';
import TeamCard from '../components/teams/TeamCard';
import CreateTeamModal from '../components/teams/CreateTeamModal';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Skeleton from '../components/common/Skeleton';

export default function TeamsPage() {
  const { data: teams, loading, error, refetch } = useFetch((cfg) => listTeams(cfg), []);
  const { refreshWorkspace } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const onCreated = (team) => {
    setCreating(false);
    refreshWorkspace();
    toast.success(`Team "${team.name}" created`);
    navigate(`/teams/${team._id}`);
  };

  let content;
  if (loading) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    );
  } else if (error) {
    content = <ErrorState title="Could not load your teams" message={error.message} onRetry={refetch} />;
  } else if (!teams.length) {
    content = (
      <EmptyState
        icon="users"
        title="You're not in any team yet"
        message="Create a team, then add teammates by email. Or ask a team owner to add you."
        action={
          <Button icon="plus" onClick={() => setCreating(true)}>
            Create your first team
          </Button>
        }
      />
    );
  } else {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {teams.map((t) => (
          <TeamCard key={t._id} team={t} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Your teams</h1>
          <p className="mt-1 text-sm text-ink-muted">One workspace per team. Pick one to see its boards, or start a new one.</p>
        </div>
        <Button icon="plus" onClick={() => setCreating(true)}>
          New team
        </Button>
      </div>
      {content}
      <CreateTeamModal open={creating} onClose={() => setCreating(false)} onCreated={onCreated} />
    </div>
  );
}
