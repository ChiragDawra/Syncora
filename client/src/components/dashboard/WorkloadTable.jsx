import Avatar from '../common/Avatar';

// Open tasks per member (from the $group + $lookup aggregation), most loaded first
export default function WorkloadTable({ workload }) {
  const max = Math.max(1, ...workload.map((w) => w.open));
  if (!workload.length) return <p className="py-6 text-center text-sm text-slate-500">No open tasks. Nice work.</p>;
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="micro-caps text-left text-slate-400">
            <th className="pb-2 font-semibold">Member</th>
            <th className="pb-2 font-semibold">Open</th>
            <th className="pb-2 text-right font-semibold">Overdue</th>
            <th className="pb-2 text-right font-semibold">Urgent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {workload.map((w) => (
            <tr key={w.user?._id || 'unassigned'}>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2.5">
                  <Avatar user={w.user} size="sm" />
                  <span className={`truncate ${w.user ? 'text-ink' : 'italic text-slate-500'}`}>{w.user?.name || 'Unassigned'}</span>
                </div>
              </td>
              <td className="py-2.5 pr-3 sm:w-2/5">
                <div className="flex items-center gap-2">
                  <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 sm:block">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(w.open / max) * 100}%` }} />
                  </div>
                  <span className="w-5 font-medium tabular-nums text-slate-700 sm:text-right">{w.open}</span>
                </div>
              </td>
              <td className={`py-2.5 text-right tabular-nums ${w.overdue ? 'font-semibold text-red-600' : 'text-slate-300'}`}>{w.overdue}</td>
              <td className={`py-2.5 text-right tabular-nums ${w.urgent ? 'font-semibold text-orange-600' : 'text-slate-300'}`}>{w.urgent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
