
CREATE DATABASE IF NOT EXISTS attendance_tracker;
USE attendance_tracker;


DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;

CREATE TABLE teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,         
    role ENUM('teacher', 'admin') DEFAULT 'teacher',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no INT UNIQUE NOT NULL,       
    password VARCHAR(255) NOT NULL,        
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_year CHECK (year BETWEEN 1 AND 4)
);


CREATE TABLE subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    teacher_id INT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);


CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Late') NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_attendance (student_id, subject_id, date)
);


CREATE OR REPLACE VIEW student_attendance_summary AS
SELECT 
    s.student_id,
    s.roll_no,
    s.name AS student_name,
    s.department,
    s.year,
    sub.subject_id,
    sub.subject_name,
    COUNT(*) AS total_classes,
    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
    SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
    SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late_count,
    ROUND(
        SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
    ) AS attendance_percentage
FROM students s
JOIN attendance a ON s.student_id = a.student_id
JOIN subjects sub ON a.subject_id = sub.subject_id
GROUP BY s.student_id, s.roll_no, s.name, s.department, s.year, sub.subject_id, sub.subject_name;


DELIMITER //
CREATE PROCEDURE GetLowAttendanceStudents(IN threshold DECIMAL(5,2))
BEGIN
    SELECT 
        s.student_id,
        s.roll_no,
        s.name,
        s.department,
        s.year,
        COUNT(*) AS total_classes,
        SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS attended,
        ROUND(
            SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
        ) AS percentage
    FROM students s
    JOIN attendance a ON s.student_id = a.student_id
    GROUP BY s.student_id, s.roll_no, s.name, s.department, s.year
    HAVING percentage < threshold
    ORDER BY percentage ASC;
END //
DELIMITER ;
