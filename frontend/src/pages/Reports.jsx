
import { useState, useEffect } from 'react';
import { getPercentage, getLowAttendance, getSubjectWise, getDailySummary, getSubjects } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Reports() {
  const [tab, setTab] = useState('percentage');
  const [data, setData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();
  }, [tab, selectedSubject]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let res;
      switch (tab) {
        case 'percentage':
          res = await getPercentage(selectedSubject || undefined);
          break;
        case 'low':
          res = await getLowAttendance(75);
          break;
        case 'subject':
          res = await getSubjectWise();
          break;
        case 'daily':
          res = await getDailySummary(selectedSubject || undefined);
          break;
      }
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getPctClass = (pct) => pct >= 75 ? 'high' : pct >= 50 ? 'medium' : 'low';
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  const filteredData = data.filter(d => {
    if ((tab !== 'percentage' && tab !== 'low') || !search) return true;
    const term = search.toLowerCase();
    return d.roll_no?.toString().includes(term) || d.name?.toLowerCase().includes(term);
  });

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
        <button className="btn btn-success" onClick={() => exportCSV(selectedSubject || undefined)}>
          📥 Export CSV
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'percentage' ? 'active' : ''}`} onClick={() => setTab('percentage')}>
          Per Student
        </button>
        <button className={`tab ${tab === 'low' ? 'active' : ''}`} onClick={() => setTab('low')}>
          Low Attendance (&lt;75%)
        </button>
        <button className={`tab ${tab === 'subject' ? 'active' : ''}`} onClick={() => setTab('subject')}>
          Subject-wise
        </button>
        <button className={`tab ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}>
          Daily Summary
        </button>
      </div>

      {(tab === 'percentage' || tab === 'daily' || tab === 'low') && (
        <div className="toolbar" style={{ display: 'flex', gap: '10px' }}>
          {(tab === 'percentage' || tab === 'daily') && (
            <select
              className="search-input"
              style={{ minWidth: '200px' }}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
              ))}
            </select>
          )}
          {(tab === 'percentage' || tab === 'low') && (
            <input
              className="search-input"
              style={{ minWidth: '200px' }}
              type="text"
              placeholder="Search by roll no or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>
      )}

      {loading ? (
        <div className="empty-state"><p>Loading...</p></div>
      ) : (
        <>

          {tab === 'percentage' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Total</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(s => (
                    <tr key={s.student_id}>
                      <td><strong>{s.roll_no}</strong></td>
                      <td>{s.name}</td>
                      <td>{s.department}</td>
                      <td>{s.total_classes}</td>
                      <td>{s.present_count}</td>
                      <td>{s.absent_count}</td>
                      <td>{s.late_count}</td>
                      <td>
                        <div className="pct-bar">
                          <div
                            className={`pct-fill ${getPctClass(s.percentage)}`}
                            style={{ width: `${s.percentage}%` }}
                          />
                        </div>
                        <strong style={{ color: s.percentage < 75 ? '#ef4444' : '#10b981' }}>
                          {s.percentage}%
                        </strong>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', color: '#9ca3af' }}>No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}


          {tab === 'low' && (
            <>
              {filteredData.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Year</th>
                        <th>Total</th>
                        <th>Attended</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(s => (
                        <tr key={s.student_id}>
                          <td><strong>{s.roll_no}</strong></td>
                          <td>{s.name}</td>
                          <td>{s.department}</td>
                          <td>{s.year}</td>
                          <td>{s.total_classes}</td>
                          <td>{s.attended}</td>
                          <td>
                            <strong style={{ color: '#ef4444' }}>{s.percentage}%</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', color: '#10b981' }}>
                  <p>🎉 All students have attendance ≥ 75%</p>
                </div>
              )}
            </>
          )}


          {tab === 'subject' && (
            <>
              {data.length > 0 && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="subject_name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                      <Bar dataKey="attendance_percentage" radius={[6, 6, 0, 0]}>
                        {data.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Teacher</th>
                      <th>Students</th>
                      <th>Classes</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(s => (
                      <tr key={s.subject_id}>
                        <td><strong>{s.subject_name}</strong></td>
                        <td>{s.teacher_name || '-'}</td>
                        <td>{s.total_students}</td>
                        <td>{s.total_classes}</td>
                        <td>{s.present_count}</td>
                        <td>{s.absent_count}</td>
                        <td>{s.late_count}</td>
                        <td>
                          <strong style={{ color: s.attendance_percentage >= 75 ? '#10b981' : '#ef4444' }}>
                            {s.attendance_percentage}%
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}


          {tab === 'daily' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <tr key={i}>
                      <td><strong>{new Date(d.date).toLocaleDateString()}</strong></td>
                      <td>{d.total}</td>
                      <td><span className="badge badge-present">{d.present}</span></td>
                      <td><span className="badge badge-absent">{d.absent}</span></td>
                      <td><span className="badge badge-late">{d.late}</span></td>
                      <td>
                        <div className="pct-bar">
                          <div className={`pct-fill ${getPctClass(d.percentage)}`} style={{ width: `${d.percentage}%` }} />
                        </div>
                        <strong>{d.percentage}%</strong>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: '#9ca3af' }}>No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
