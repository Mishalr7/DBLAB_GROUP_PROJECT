# 🚀 Local Setup Guide

Follow these steps to run the Attendance Tracker on your laptop.

## 📋 Prerequisites
- **Node.js** (v18+)
- **MySQL** (v8.0+)

---

## 🛠️ Step 1: Database Setup
1. Open MySQL Command Line or Workbench.
2. Run the following command (replace with your actual path):
   ```sql
   source C:/path/to/DBMS_LAB_GROUP_PROJECT/backend/schema.sql;
   ```

## 🔐 Step 2: Configure Environment
Edit **`backend/.env`** and set your MySQL details:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=attendance_tracker
PORT=5000
```

## 📦 Step 3: Install & Seed
Run these in your terminal:
```bash
# Setup Backend
cd backend
npm install
npm run seed

# Setup Frontend
cd ../frontend
npm install
```

## 🏃 Step 4: Run the App
Open **two terminals**:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Access the app at: **http://localhost:5173**

---

## 🔑 Login Credentials
All passwords are **`username@123`**

| Username | Role |
|----------|------|
| aswathy  | Admin|
| vinod    | Teacher|
| suvarna  | Teacher|
| latha    | Teacher|
| swaiba   | Teacher|
