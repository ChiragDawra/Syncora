# Syncora: frontend (React)

React 18 + Vite + React Router 6 + Axios + Tailwind. Covers CHO unit 6 (React fundamentals) and unit 7 (full-stack integration).

## 1. Routes

```jsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>      {/* nested layout with <Outlet/> */}
        <Route index element={<Navigate to="/teams" replace />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/:teamId" element={<TeamLayout />}>                {/* nested routes */}
          <Route index element={<TeamBoardsPage />} />
          <Route path="dashboard" element={<TeamDashboardPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="settings" element={<RoleGate roles={['owner','admin']}><TeamSettingsPage /></RoleGate>} />
        </Route>
        <Route path="boards/:boardId" element={<BoardPage />}>
          <Route path="tasks/:taskId" element={<TaskDrawer />} />             {/* task opens over the board */}
        </Route>
        <Route path="my-tasks" element={<MyTasksPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

| Path | Page | Who sees it |
|---|---|---|
| `/login`, `/register` | Auth forms | Logged-out users (logged-in users are redirected to `/teams`) |
| `/teams` | My teams + "New team" | Logged in |
| `/teams/:teamId` | Boards grid + members sidebar | Members |
| `/teams/:teamId/dashboard` | Workload, due soon, completed chart | Members |
| `/teams/:teamId/activity` | Activity feed (paginated) | Members |
| `/teams/:teamId/settings` | Rename, members and roles, delete team | Owner, admin (delete: owner) |
| `/boards/:boardId` | Kanban board with filters and search | Members |
| `/boards/:boardId/tasks/:taskId` | Task drawer: details, comments, attachments | Members |
| `/my-tasks` | Everything assigned to me | Logged in |
| `/profile` | Name, avatar, password | Logged in |

## 2. State management

| State | Where | Why |
|---|---|---|
| Logged-in user, token, auth status | `AuthContext` with `useReducer` | Needed everywhere; avoids prop drilling |
| Current team and my role | `TeamContext` (provided by `TeamLayout`) | Role-based UI inside a team |
| Page data (boards, tasks, comments) | `useState` inside custom hooks | Local to the page; refetch on change |
| Filters, search, page | URL search params (`useSearchParams`) | Shareable, survives refresh |
| Toasts | `react-hot-toast` | Global, no state needed |

### AuthContext reducer

```js
const initial = { user: null, token: localStorage.getItem('token'), status: 'checking' }; // checking | authenticated | anonymous

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'SESSION_RESTORED': return { ...state, user: action.user, token: action.token ?? state.token, status: 'authenticated' };
    case 'LOGOUT':           return { user: null, token: null, status: 'anonymous' };
    case 'USER_UPDATED':     return { ...state, user: action.user };
    default:                 return state;
  }
}
```

Exposed by `useAuth()`: `{ user, status, login(email, pw), register(data), logout(), updateUser(user) }`.

## 3. API layer

`src/api/client.js`:

```js
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 15000 });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res.data,                                   // unwrap { success, data, meta }
  err => {
    const status = err.response?.status;
    const body = err.response?.data?.error || {};
    if (status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));   // AuthContext listens and dispatches LOGOUT
    }
    return Promise.reject({ status, code: body.code || 'NETWORK_ERROR', message: body.message || 'Network error, check your connection', details: body.details || [] });
  }
);
export default api;
```

One file per resource (`api/auth.js`, `teams.js`, `boards.js`, `tasks.js`, `comments.js`), each exporting small functions such as `listTasks(boardId, params)`.

Vite dev proxy (`vite.config.js`), so the browser calls same-origin `/api` in development and CORS isn't involved locally:

```js
server: { proxy: { '/api': 'http://localhost:5000', '/uploads': 'http://localhost:5000' } }
```

In production `VITE_API_URL` points at the deployed API, and the API's CORS allows the Vercel origin.

## 4. Custom hooks

| Hook | Does |
|---|---|
| `useAuth()` | Reads `AuthContext` |
| `useTeam()` | Reads `TeamContext` (`team`, `myRole`, `can(action)`) |
| `useFetch(fn, deps)` | Runs an API call in `useEffect`, returns `{ data, meta, loading, error, refetch }`, ignores stale responses with an `AbortController` |
| `useTasks(boardId, filters)` | `useFetch` around `listTasks` + `createTask`, `updateTask`, `moveTask` (optimistic) |
| `useDebounce(value, ms)` | Debounce the search box (400 ms) |
| `usePagination(meta)` | `{ page, setPage, hasNext, hasPrev }` synced to the URL |
| `useUpload()` | Upload with `onUploadProgress`, returns `{ upload, progress, uploading, error }` |

## 5. Components

```
components/
  layout/      AppLayout (navbar + sidebar + <Outlet/>), TeamLayout, Navbar, Sidebar
  auth/        ProtectedRoute, GuestRoute, RoleGate
  common/      Button, Input, Select, TextArea, Modal, ConfirmDialog, Spinner, Skeleton,
               EmptyState, ErrorState, Pagination, Avatar, Badge, ProgressBar, SearchBox
  teams/       TeamCard, CreateTeamModal, MembersPanel, MemberRow (role select), InviteForm
  boards/      BoardCard, CreateBoardModal, BoardHeader, BoardFilters, BoardStats
  tasks/       KanbanColumn, TaskCard, CreateTaskModal, TaskForm, TaskDrawer, PriorityBadge,
               DueDateBadge, AssigneeSelect, LabelInput
  comments/    CommentList, CommentForm
  attachments/ AttachmentList, AttachmentUploader
  dashboard/   WorkloadTable, DueSoonList, CompletedChart (simple CSS bars, no chart library needed)
```

Props flow down, events flow up (`onCreate`, `onMove`); lists use stable `key={task._id}`.

### Route guards

```jsx
function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') return <FullPageSpinner />;
  if (status === 'anonymous') return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RoleGate({ roles, children, fallback = <ErrorState title="You don't have access to this page" /> }) {
  const { myRole } = useTeam();
  return roles.includes(myRole) ? children : fallback;
}
```

### Role-based UI (hide what you can't do; the server still enforces it)

| UI element | Shown to |
|---|---|
| "New board", board rename, archive, delete | owner, admin |
| Settings tab | owner, admin |
| Delete team, change member role | owner |
| Remove member button | owner (anyone but self), admin (members only) |
| Delete task | owner, admin, task creator |
| Delete comment | owner, admin, comment author |
| "Leave team" | admin, member |

`useTeam().can('board:create')` reads from one permission map in `src/utils/permissions.js`, which mirrors the server matrix in SYSTEM_DESIGN.md.

## 6. Forms (controlled components)

- Every input is controlled (`value` + `onChange`) through a small `useForm` helper or plain `useState`.
- Validate on submit and on blur: required, lengths, email format, password rule, due date not in the past (warning only).
- Disable the submit button and show a spinner while submitting.
- Map server `details[]` from a 400 back onto the matching fields.

## 7. UI states (CHO unit 7: loading, error, UX basics)

Every data view handles four states:

| State | Show |
|---|---|
| Loading | Skeleton cards (board), spinner (small widgets) |
| Error | `ErrorState` with the message and a **Retry** button calling `refetch` |
| Empty | `EmptyState` with a call to action ("No tasks yet. Add the first one") |
| Data | The content |

Also: toasts for create, update and delete; a confirm dialog before deletes; an upload progress bar; a "Session expired, please log in again" notice when `?expired=1`; a 404 page.

## 8. Board page behaviour

- Header: board name, stats strip (`BoardStats`: total, done %, overdue), "New task".
- Filters bar: status chips, priority select, assignee select (Anyone, Me, Unassigned, members), label, overdue toggle, search box (debounced), sort select. All synced to the URL.
- Three columns (To Do, In Progress, Done). With filters active, show a "Filtered" tag and a "Clear filters" button.
- Each card: title, priority badge, due badge (red when overdue), assignee avatar, comment and attachment counts.
- Moving: drag and drop (`@hello-pangea/dnd`) or a status dropdown on the card (build the dropdown first; drag and drop is P1).
- Clicking a card opens `/boards/:boardId/tasks/:taskId` as a drawer (nested route), so the URL is shareable.
- Large boards: the board view loads each column's first 50 tasks with "Load more"; the list view uses numbered pagination.

## 9. Styling

- Tailwind utility classes; a small set of shared components so the look stays consistent.
- Responsive: columns stack vertically under `md`; the sidebar becomes a top menu on mobile.
- Accessible basics: labels on inputs, focus rings, buttons with text (not icon-only), color plus text for priority.

## 10. Environment

`client/.env.example`:

```
VITE_API_URL=/api
```

Never put secrets in `VITE_` variables; they end up in the browser bundle.
