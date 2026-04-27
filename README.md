# Attendance Tracker

A college-level attendance tracking system built as a DBMS Lab Group Project.

**Tech Stack:** React + Node.js/Express + MySQL

---

## 📁 Project Structure

```
DBMS_LAB_GROUP_PROJECT/
├── backend/               # Express API server
│   ├── config/db.js       # MySQL connection pool
│   ├── middleware/auth.js  # Authentication middleware
│   ├── routes/            # API route handlers
│   │   ├── auth.js        # Login/logout
│   │   ├── students.js    # Student CRUD
│   │   ├── teachers.js    # Teacher CRUD
│   │   ├── subjects.js    # Subject CRUD
│   │   ├── attendance.js  # Mark & fetch attendance
│   │   └── reports.js     # Reports, stats, CSV export
│   ├── schema.sql         # Database schema (tables, VIEW, stored procedure)
│   ├── seed.js            # Sample data seeder
│   ├── server.js          # Express entry point
│   └── .env               # Environment variables
├── frontend/              # React (Vite) application
│   └── src/
│       ├── api/index.js   # Centralized API calls
│       ├── context/       # Auth context
│       ├── components/    # Layout, ProtectedRoute
│       └── pages/         # Login, Dashboard, Students, etc.
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** (v18+)
- **MySQL** (v8.0+) running on port 3306

### Step 1: Create the Database

Open MySQL command line or MySQL Workbench and run:

```sql
source C:/path/to/DBMS_LAB_GROUP_PROJECT/backend/schema.sql;
```

Or copy-paste the contents of `backend/schema.sql` into your MySQL client.

### Step 2: Configure Environment

Edit `backend/.env` and set your MySQL password:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_tracker
DB_PORT=3306
SESSION_SECRET=attendance-tracker-secret-key-2024
PORT=5000
```

### Step 3: Install Dependencies & Seed Data

```bash
# Backend
cd backend
npm install
npm run seed

# Frontend
cd ../frontend
npm install
```

### Step 4: Start the Application

Open **two terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔐 Login Credentials

| Username | Password     | Role    |
|----------|-------------|---------|
| admin    | password123 | Admin   |
| mehta    | password123 | Teacher |
| gupta    | password123 | Teacher |

---

## 🧩 Features

### For All Users (Teachers & Admin)
- **Dashboard** — Stats overview with attendance chart
- **Mark Attendance** — Select subject + date, mark students Present/Absent/Late
  - Quick-mark by entering roll number
  - Bulk "Mark All Present" button
- **Reports** — Per-student %, low attendance, subject-wise, daily summary
- **CSV Export** — Download attendance data

### Admin Only
- **Student Management** — Add, edit, delete students (with search)
- **Subject Management** — Add subjects, assign teachers
- **Teacher Management** — Add, edit, delete teachers

---

## 🗄️ Database Design

### Tables
| Table | Primary Key | Key Constraints |
|-------|------------|-----------------|
| `teachers` | `teacher_id` | `username` UNIQUE, `role` ENUM |
| `students` | `student_id` | `roll_no` UNIQUE, `year` CHECK(1-4) |
| `subjects` | `subject_id` | `teacher_id` FK → teachers |
| `attendance` | `attendance_id` | `student_id` FK, `subject_id` FK, `status` ENUM, UNIQUE(student_id, subject_id, date) |

### VIEW
- `student_attendance_summary` — Pre-computed attendance percentage per student per subject

### Stored Procedure
- `GetLowAttendanceStudents(threshold)` — Returns students below given attendance %

### Key SQL Features Used
- **JOIN** (INNER, LEFT) across multiple tables
- **GROUP BY** with aggregate functions (COUNT, SUM)
- **HAVING** clause for filtering aggregates
- **CASE WHEN** for conditional counting
- **INSERT ... ON DUPLICATE KEY UPDATE** for attendance upsert
- **Transactions** for bulk attendance marking
- **Parameterized queries** (SQL injection prevention)

---

## ⚙️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Session check |
| GET | `/api/students` | List students (search support) |
| POST/PUT/DELETE | `/api/students/:id` | CRUD (admin) |
| GET | `/api/subjects` | List with teacher JOIN |
| POST/PUT/DELETE | `/api/subjects/:id` | CRUD (admin) |
| GET | `/api/teachers` | List (no passwords) |
| POST/PUT/DELETE | `/api/teachers/:id` | CRUD (admin) |
| POST | `/api/attendance/mark` | Bulk mark attendance |
| GET | `/api/attendance` | Get by subject+date |
| GET | `/api/reports/dashboard` | Dashboard stats |
| GET | `/api/reports/percentage` | Per-student % |
| GET | `/api/reports/low-attendance` | <75% students |
| GET | `/api/reports/subject-wise` | Subject summary |
| GET | `/api/reports/daily-summary` | Daily breakdown |
| GET | `/api/reports/export-csv` | CSV download |

---

## 🔒 Security

- Passwords hashed with **bcrypt**
- Passwords **never exposed** in API responses
- **httpOnly** session cookies
- **Parameterized queries** (no SQL injection)
- **Input validation** on all endpoints
- `.env` file in `.gitignore`
