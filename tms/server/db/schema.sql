-- Tuition Management System — schema
-- Run this once against your MySQL server:
--   mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS tuition_db;
USE tuition_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  father_name VARCHAR(100),
  mother_name VARCHAR(100),
  mobile VARCHAR(15) NOT NULL,
  address TEXT,
  class VARCHAR(30) NOT NULL,
  school VARCHAR(100),
  admission_date DATE NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  month VARCHAR(20) NOT NULL,
  year INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode VARCHAR(30) NOT NULL DEFAULT 'Cash',
  receipt_no VARCHAR(30) UNIQUE,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_student_month_year (student_id, month, year)
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('Present','Absent','Leave') NOT NULL,
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_student_date (student_id, date)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Other',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  institute_name VARCHAR(150) DEFAULT 'Tuition Classes',
  phone VARCHAR(20),
  address TEXT,
  upi_id VARCHAR(100),
  logo VARCHAR(255)
);

INSERT INTO settings (id, institute_name)
  VALUES (1, 'Nitish Tuition Classes')
  ON DUPLICATE KEY UPDATE id = id;
