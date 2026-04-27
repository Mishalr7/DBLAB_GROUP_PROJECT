/**
 * Subjects Page - Manage subjects with teacher assignment (Admin only)
 */
import { useState, useEffect } from 'react';
import { getSubjects, addSubject, updateSubject, deleteSubject, getTeachers } from '../api';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ subject_name: '', teacher_id: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchData = () => {
    getSubjects().then(res => setSubjects(res.data)).catch(console.error);
    getTeachers().then(res => setTeachers(res.data)).catch(console.error);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ subject_name: '', teacher_id: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (subj) => {
    setEditing(subj);
    setForm({ subject_name: subj.subject_name, teacher_id: subj.teacher_id || '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = { ...form, teacher_id: form.teacher_id || null };
      if (editing) {
        await updateSubject(editing.subject_id, data);
        setMessage('Subject updated');
      } else {
        await addSubject(data);
        setMessage('Subject added');
      }
      setShowModal(false);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete subject "${name}"? Related attendance records will be deleted.`)) return;
    try {
      await deleteSubject(id);
      setMessage('Subject deleted');
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Subjects</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Subject</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject Name</th>
              <th>Assigned Teacher</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s.subject_id}>
                <td>{s.subject_id}</td>
                <td><strong>{s.subject_name}</strong></td>
                <td>{s.teacher_name || <span style={{ color: '#9ca3af' }}>Not assigned</span>}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)} style={{ marginRight: '6px' }}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.subject_id, s.subject_name)}>Delete</button>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af' }}>No subjects found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Subject' : 'Add Subject'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject Name</label>
                <input type="text" value={form.subject_name} onChange={(e) => setForm({...form, subject_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Assign Teacher</label>
                <select value={form.teacher_id} onChange={(e) => setForm({...form, teacher_id: e.target.value})}>
                  <option value="">-- No Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.teacher_id} value={t.teacher_id}>{t.name} ({t.username})</option>
                  ))}
                </select>
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
