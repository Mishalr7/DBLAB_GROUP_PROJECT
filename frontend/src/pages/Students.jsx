
import { useState, useEffect } from 'react';
import { getStudents, addStudent, updateStudent, deleteStudent } from '../api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ roll_no: '', name: '', department: 'CSE', year: '2' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchStudents = () => {
    getStudents({ search }).then(res => setStudents(res.data)).catch(console.error);
  };

  useEffect(() => { fetchStudents(); }, [search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ roll_no: '', name: '', department: 'CSE', year: '2' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({
      roll_no: student.roll_no,
      name: student.name,
      department: 'CSE',
      year: '2'
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await updateStudent(editing.student_id, form);
        setMessage('Student updated successfully');
      } else {
        await addStudent(form);
        setMessage('Student added successfully');
      }
      setShowModal(false);
      fetchStudents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This will also delete their attendance records.`)) return;
    try {
      await deleteStudent(id);
      setMessage('Student deleted');
      fetchStudents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Students</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Student</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search by roll number or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ color: '#9ca3af', fontSize: '13px' }}>{students.length} students (CSE 2nd Year)</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.student_id}>
                <td><strong>{s.roll_no}</strong></td>
                <td>{s.name}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)} style={{ marginRight: '6px' }}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.student_id, s.name)}>Delete</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: '#9ca3af' }}>No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>


      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Student' : 'Add Student'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Roll Number</label>
                <input type="text" value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
