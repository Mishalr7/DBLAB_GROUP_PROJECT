
import { useState, useEffect } from 'react';
import { getSubjects, getAttendance, markAttendance } from '../api';

export default function MarkAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNo, setSessionNo] = useState('1');
  const [students, setStudents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [quickRoll, setQuickRoll] = useState('');


  useEffect(() => {
    getSubjects().then(res => setSubjects(res.data)).catch(console.error);
  }, []);

  const handleLoad = async () => {
    if (!selectedSubject || !selectedDate) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await getAttendance(selectedSubject, selectedDate, sessionNo);

      const mapped = res.data.map(s => ({
        student_id: s.student_id,
        roll_no: s.roll_no,
        name: s.name,
        department: s.department,
        year: s.year,
        status: s.status || 'Present'
      }));
      setStudents(mapped);
      setLoaded(true);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load students' });
    }
  };


  const updateStatus = (studentId, status) => {
    setStudents(prev =>
      prev.map(s => s.student_id === studentId ? { ...s, status } : s)
    );
  };


  const handleQuickMark = (e) => {
    e.preventDefault();
    if (!quickRoll.trim()) return;

    const student = students.find(
      s => String(s.roll_no).toLowerCase() === quickRoll.trim().toLowerCase()
    );

    if (student) {
      updateStatus(student.student_id, 'Present');
      setMessage({ type: 'success', text: `${student.name} (${student.roll_no}) marked Present` });
    } else {
      setMessage({ type: 'error', text: `Roll number "${quickRoll}" not found` });
    }
    setQuickRoll('');
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status: s.status
      }));

      await markAttendance({
        subject_id: parseInt(selectedSubject),
        date: selectedDate,
        session_no: parseInt(sessionNo),
        records
      });

      setMessage({ type: 'success', text: `Attendance saved for ${records.length} students!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.filter(s => s.status === 'Absent').length;
  const lateCount = students.filter(s => s.status === 'Late').length;

  return (
    <div>
      <div className="page-header">
        <h1>Mark Attendance</h1>
      </div>


      <div className="card">
        <div className="toolbar" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <label htmlFor="subject-select">Subject</label>
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={(e) => { setSelectedSubject(e.target.value); setLoaded(false); }}
            >
              <option value="">-- Select Subject --</option>
              {subjects.map(s => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_name} {s.teacher_name ? `(${s.teacher_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '150px' }}>
            <label htmlFor="date-select">Date</label>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setLoaded(false); }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '120px' }}>
            <label htmlFor="session-select">Session / Hour</label>
            <select
              id="session-select"
              value={sessionNo}
              onChange={(e) => { setSessionNo(e.target.value); setLoaded(false); }}
            >
              {[1,2,3,4,5,6,7,8].map(n => (
                <option key={n} value={n}>Session {n}</option>
              ))}
            </select>
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleLoad} disabled={!selectedSubject}>
              Load Students
            </button>
          </div>
        </div>
      </div>


      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}


      {loaded && students.length > 0 && (
        <>

          <div className="quick-mark">
            <span>⚡ Quick Mark:</span>
            <form onSubmit={handleQuickMark} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter roll number"
                value={quickRoll}
                onChange={(e) => setQuickRoll(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">Mark Present</button>
            </form>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              <button className="btn btn-success btn-sm" onClick={() => markAll('Present')}>All Present</button>
              <button className="btn btn-danger btn-sm" onClick={() => markAll('Absent')}>All Absent</button>
            </div>
          </div>


          <div style={{ marginBottom: '12px', display: 'flex', gap: '16px', fontSize: '13px' }}>
            <span><strong>Total:</strong> {students.length}</span>
            <span className="badge badge-present">Present: {presentCount}</span>
            <span className="badge badge-absent">Absent: {absentCount}</span>
            <span className="badge badge-late">Late: {lateCount}</span>
          </div>


          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.student_id}>
                    <td>{idx + 1}</td>
                    <td><strong>{s.roll_no}</strong></td>
                    <td>{s.name}</td>
                    <td>{s.department}</td>
                    <td>{s.year}</td>
                    <td>
                      <select
                        className={`status-select ${s.status.toLowerCase()}`}
                        value={s.status}
                        onChange={(e) => updateStatus(s.student_id, e.target.value)}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Attendance'}
            </button>
          </div>
        </>
      )}

      {loaded && students.length === 0 && (
        <div className="empty-state"><p>No students found.</p></div>
      )}
    </div>
  );
}
