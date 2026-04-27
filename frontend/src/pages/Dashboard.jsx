/**
 * Dashboard Page - Stats overview with charts
 */
import { useState, useEffect } from 'react';
import { getDashboard, getSubjectWise } from '../api';


export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getSubjectWise()])
      .then(([dashRes, subRes]) => {
        setStats(dashRes.data);
        setSubjectData(subRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><p>Loading dashboard...</p></div>;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.students || 0}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.teachers || 0}</div>
          <div className="stat-label">Total Teachers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.subjects || 0}</div>
          <div className="stat-label">Subjects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: stats?.overallPercentage >= 75 ? '#10b981' : '#ef4444' }}>
            {stats?.overallPercentage || 0}%
          </div>
          <div className="stat-label">Overall Attendance</div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '12px' }}>Today's Attendance</h3>
        {stats?.today?.total > 0 ? (
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <span className="badge badge-present" style={{ fontSize: '16px', padding: '6px 16px' }}>
                {stats.today.present || 0} Present
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span className="badge badge-absent" style={{ fontSize: '16px', padding: '6px 16px' }}>
                {stats.today.absent || 0} Absent
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span className="badge badge-late" style={{ fontSize: '16px', padding: '6px 16px' }}>
                {stats.today.late || 0} Late
              </span>
            </div>
          </div>
        ) : (
          <p style={{ color: '#9ca3af' }}>No attendance marked today yet.</p>
        )}
      </div>


    </div>
  );
}
