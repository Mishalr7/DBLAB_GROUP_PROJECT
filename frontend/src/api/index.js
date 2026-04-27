
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

//Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const logout = () => api.post('/auth/logout');

export const getMe = () => api.get('/auth/me');
export const changePassword = (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword });

//Students
export const getStudents = (params) => api.get('/students', { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const addStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

//Teachers
export const getTeachers = () => api.get('/teachers');
export const addTeacher = (data) => api.post('/teachers', data);
export const updateTeacher = (id, data) => api.put(`/teachers/${id}`, data);
export const deleteTeacher = (id) => api.delete(`/teachers/${id}`);

//Subjects
export const getSubjects = () => api.get('/subjects');
export const addSubject = (data) => api.post('/subjects', data);
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);

//Attendance
export const markAttendance = (data) => api.post('/attendance/mark', data);
export const getAttendance = (subject_id, date, session_no) =>
  api.get('/attendance', { params: { subject_id, date, session_no } });
export const getStudentAttendance = (id) => api.get(`/attendance/student/${id}`);
export const searchPublicStudents = (q) => api.get('/attendance/public/search', { params: { q } });
export const getPublicStudentAttendance = (roll_no) => api.get(`/attendance/public/${roll_no}`);
//Reports
export const getDashboard = () => api.get('/reports/dashboard');
export const getPercentage = (subject_id) =>
  api.get('/reports/percentage', { params: { subject_id } });
export const getLowAttendance = (threshold) =>
  api.get('/reports/low-attendance', { params: { threshold } });
export const getSubjectWise = () => api.get('/reports/subject-wise');
export const getDailySummary = (subject_id) =>
  api.get('/reports/daily-summary', { params: { subject_id } });
export default api;
