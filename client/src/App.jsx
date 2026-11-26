import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';
import RoleGate from './components/auth/RoleGate';
import AppLayout from './components/layout/AppLayout';
import TeamLayout from './components/layout/TeamLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TeamsPage from './pages/TeamsPage';
import TeamBoardsPage from './pages/TeamBoardsPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import ActivityPage from './pages/ActivityPage';
import TeamSettingsPage from './pages/TeamSettingsPage';
import BoardPage from './pages/BoardPage';
import TaskDrawer from './components/tasks/TaskDrawer';
import MyTasksPage from './pages/MyTasksPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* nested layout route: everything inside needs a login and shares the navbar */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/teams" replace />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/:teamId" element={<TeamLayout />}>
          <Route index element={<TeamBoardsPage />} />
          <Route path="dashboard" element={<TeamDashboardPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="settings" element={<RoleGate roles={['owner', 'admin']}><TeamSettingsPage /></RoleGate>} />
        </Route>
        <Route path="boards/:boardId" element={<BoardPage />}>
          <Route path="tasks/:taskId" element={<TaskDrawer />} /> {/* task opens over the board */}
        </Route>
        <Route path="my-tasks" element={<MyTasksPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
