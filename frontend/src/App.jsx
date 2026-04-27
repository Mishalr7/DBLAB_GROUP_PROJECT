import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MarkAttendance from './pages/MarkAttendance';
import Reports from './pages/Reports';
import Students from './pages/Students';
import Subjects from './pages/Subjects';
import Teachers from './pages/Teachers';
import PublicSearch from './pages/PublicSearch';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicSearch />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes inside Layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}><Layout /></ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="attendance" element={<MarkAttendance />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="students" element={
              <ProtectedRoute allowedRoles={['admin']}><Students /></ProtectedRoute>
            } />
            <Route path="subjects" element={
              <ProtectedRoute allowedRoles={['admin']}><Subjects /></ProtectedRoute>
            } />
            <Route path="teachers" element={
              <ProtectedRoute allowedRoles={['admin']}><Teachers /></ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
