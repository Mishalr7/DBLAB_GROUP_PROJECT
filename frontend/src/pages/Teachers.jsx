/**
 * Teachers Page - Manage teachers (Admin only)
 */
import { useState, useEffect } from 'react';
import { getTeachers, addTeacher, updateTeacher, deleteTeacher } from '../api';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'teacher' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchTeachers = () => {
    getTeachers().then(res => setTeachers(res.data)).catch(console.error);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', username: '', password: '', role: 'teacher' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (teacher) => {
    setEditing(teacher);
    setForm({ name: teacher.name, username: teacher.username, password: '', role: teacher.role });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        const data = { ...form };
        if (!data.password) delete data.password; // Don't update password if empty
        await updateTeacher(editing.teacher_id, data);
        setMessage('Teacher updated');
      } else {
        if (!form.password) {
          setError('Password is required for new teachers');
          return;
        }
        await addTeacher(form);
        setMessage('Teacher added');
      }
      setShowModal(false);
      fetchTeachers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"?`)) return;
    try {
      await deleteTeacher(id);
      setMessage('Teacher deleted');
      fetchTeachers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Teachers</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Teacher</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.teacher_id}>
                <td>{t.teacher_id}</td>
                <td><strong>{t.name}</strong></td>
                <td>{t.username}</td>
                <td>
                  <span className={`badge ${t.role === 'admin' ? 'badge-late' : 'badge-present'}`}>
                    {t.role}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)} style={{ marginRight: '6px' }}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.teacher_id, t.name)}>Delete</button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: '#9ca3af' }}>No teachers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Teacher' : 'Add Teacher'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Password {editing && '(leave blank to keep current)'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} {...(!editing && { required: true })} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
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
