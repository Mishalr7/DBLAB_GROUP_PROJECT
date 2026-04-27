import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchPublicStudents, getPublicStudentAttendance } from '../api';


export default function PublicSearch() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setSelectedStudent(null);
    setAttendanceData(null);
    setSearched(true);

    try {
      const res = await searchPublicStudents(query);
      setSearchResults(res.data);
      if (res.data.length === 0) {
        setError('No students found matching your search.');
      } else if (res.data.length === 1) {
        // Auto-select if only one result
        fetchAttendance(res.data[0].roll_no);
      }
    } catch (err) {
      setError('An error occurred while searching.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (roll_no) => {
    setLoading(true);
    setError('');
    setSearchResults([]); // Hide list once selected

    try {
      const res = await getPublicStudentAttendance(roll_no);
      setSelectedStudent(res.data.student);
      setAttendanceData(res.data.stats);
    } catch (err) {
      setError('Could not fetch attendance details.');
    } finally {
      setLoading(false);
    }
  };

  const getPctClass = (pct) => pct >= 75 ? 'high' : pct >= 50 ? 'medium' : 'low';

  // Overall totals
  const totalClasses = attendanceData ? attendanceData.reduce((acc, curr) => acc + Number(curr.total_classes), 0) : 0;
  const totalAttended = attendanceData ? attendanceData.reduce((acc, curr) => acc + Number(curr.present_count) + Number(curr.late_count), 0) : 0;
  const overallPercentage = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

  return (
    <div className="public-portal">
      <header className="public-header">
        <div className="portal-logo">
          <span>🎓</span> Student Attendance
        </div>
        <Link to="/login" className="btn btn-secondary">Admin Login</Link>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="hero-card">
          <h1>Track Your Progress</h1>
          <p>Instant access to your attendance statistics.</p>
          
          <form onSubmit={handleSearch} className="search-box-wrapper">
            <input
              type="text"
              placeholder="Enter Roll No or Name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '...' : 'Search'}
            </button>
          </form>
        </div>

        {error && (
          <div className="alert alert-error" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto 24px auto' }}>{error}</div>
        )}

        {/* Search Results List */}
        {!selectedStudent && searchResults.length > 1 && (
          <div className="card" style={{ borderRadius: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Matches Found ({searchResults.length})</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(s => (
                    <tr key={s.roll_no}>
                      <td><strong>{s.roll_no}</strong></td>
                      <td>{s.name}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => fetchAttendance(s.roll_no)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Student Attendance View */}
        {selectedStudent && attendanceData && (
          <div>
            <div className="student-info-card">
              <div>
                <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>{selectedStudent.name}</h2>
                <div style={{ display: 'flex', gap: '20px', color: 'var(--gray-500)' }}>
                  <span><strong>Roll:</strong> {selectedStudent.roll_no}</span>
                  <span><strong>Batch:</strong> CSE 2nd Year</span>
                </div>
              </div>
              <div className={`overall-circle ${getPctClass(overallPercentage)}`}>
                <span className="val">{overallPercentage}%</span>
                <span className="lbl">Overall</span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{totalClasses}</div>
                <div className="stat-label">Total Classes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--success)' }}>
                  {attendanceData.reduce((acc, curr) => acc + Number(curr.present_count), 0)}
                </div>
                <div className="stat-label">Present</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--danger)' }}>
                  {attendanceData.reduce((acc, curr) => acc + Number(curr.absent_count), 0)}
                </div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--warning)' }}>
                  {attendanceData.reduce((acc, curr) => acc + Number(curr.late_count), 0)}
                </div>
                <div className="stat-label">Late</div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '24px', borderRadius: '20px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📚</span> Subject-wise Breakdown
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Total</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map(s => (
                      <tr key={s.subject_id}>
                        <td><strong>{s.subject_name}</strong></td>
                        <td>{s.total_classes}</td>
                        <td><span className="badge badge-present">{s.present_count}</span></td>
                        <td><span className="badge badge-absent">{s.absent_count}</span></td>
                        <td><span className="badge badge-late">{s.late_count}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="pct-bar" style={{ width: '60px', marginBottom: 0 }}>
                              <div 
                                className={`pct-fill ${getPctClass(s.attendance_percentage)}`} 
                                style={{ width: `${s.attendance_percentage}%` }} 
                              />
                            </div>
                            <strong style={{ color: s.attendance_percentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
                              {s.attendance_percentage}%
                            </strong>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


            
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
               <button className="btn btn-secondary" onClick={() => { setSelectedStudent(null); setSearched(false); setQuery(''); }}>
                 Search Another Student
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
