-- Supabase seed data for IIS application
-- Run this after the schema has been created.

insert into users (name, email, password, role, branch, year, caste, aadhar)
values
  ('Admin User', 'admin@iis.com', '$2b$10$U1W3noLBiFX5TFt86uN./usL54S5HZnR3tSNcQsElxdqfidKt1VK6', 'ADMIN', null, null, null, null),
  ('Faculty One', 'faculty@iis.com', '$2b$10$2Al8MVI.ykdAl1s0znJLqO1PkMm6KV72jP6urvtaHO6W4r91.fAma', 'FACULTY', null, null, null, null),
  ('Student One', 'student1@iis.com', '$2b$10$AFLuC1VenDwElYUCJN0FDubaROybZL3/howFc8Mc7STFNDpbFsBve', 'STUDENT', 'CSE', 2, 'OPEN', '123456789012');

insert into fee_templates (branch, year, caste, tuition_fee, development_fee, exam_fee, other_fee, total_fee)
values
  ('CSE', 2, 'OPEN', 10000, 2000, 1500, 500, 14000);

insert into student_fees (student_id, academic_year, tuition, development, exam, other, total, paid_amount, pending_amount, status)
values
  (3, 2024, 10000, 2000, 1500, 500, 14000, 5000, 9000, 'UNPAID');

insert into attendance_sessions (subject, faculty_id, expire_at)
values
  ('Mathematics', 2, now() + interval '30 minutes');

insert into attendance (student_id, date, status, latitude, longitude, subject, session_id)
values
  (3, current_date, 'present', 19.061605793304224, 73.3111667960819, 'Mathematics', 1);

insert into results (student_id, subject, internal, external, total, semester)
values
  (3, 'Physics', 30, 45, 75, 'Semester 2');

insert into result_issues (result_id, student_id, message, status, faculty_message)
values
  (1, 3, 'Please verify external score calculation', 'PENDING', null);

insert into resources (name, capacity, description)
values
  ('Computer Lab', 40, 'Main computer lab with 40 workstations');

insert into books (name, author, status)
values
  ('Mathematics Handbook', 'J. Doe', 'Available');

insert into exams (branch, year, subject, date, time)
values
  ('CSE', 2, 'Algorithms', '2025-05-20', '10:00 AM');

insert into notices (title, message)
values
  ('Holiday Notice', 'College will be closed on May 1 for a public holiday.');

insert into academic_events (event, date)
values
  ('Semester Start', '2025-06-01');
