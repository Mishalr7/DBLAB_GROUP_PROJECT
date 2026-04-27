
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span className="mobile-title">Attendance Tracker</span>
      </header>

      {/* Backdrop for mobile */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>📋 Attendance</h2>
          <span className="sidebar-subtitle">Tracker</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setSidebarOpen(false)}>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>

          <NavLink to="/dashboard/attendance" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setSidebarOpen(false)}>
            <span className="nav-icon">✅</span> Mark Attendance
          </NavLink>

          <NavLink to="/dashboard/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setSidebarOpen(false)}>
            <span className="nav-icon">📈</span> Reports
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <div className="nav-divider">Admin</div>
              <NavLink to="/dashboard/students" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">🎓</span> Students
              </NavLink>
              <NavLink to="/dashboard/subjects" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">📚</span> Subjects
              </NavLink>
              <NavLink to="/dashboard/teachers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">👨‍🏫</span> Teachers
              </NavLink>
            </>
          )}
          <NavLink to="/dashboard/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setSidebarOpen(false)}>
            <span className="nav-icon">⚙️</span> Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
          <button onClick={() => { handleLogout(); setSidebarOpen(false); }} className="btn-logout">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
