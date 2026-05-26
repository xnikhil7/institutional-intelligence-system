-- Supabase schema for IIS application
-- Run this in the Supabase SQL editor for the target database.

create table if not exists users (
  id bigserial primary key,
  name text not null,
  email text not null unique,
  password text not null,
  role text not null check (role in ('STUDENT', 'FACULTY', 'ADMIN')),
  branch text,
  year integer,
  caste text,
  aadhar text unique,
  created_at timestamptz not null default now()
);

create table if not exists fee_templates (
  id bigserial primary key,
  branch text not null,
  year integer not null,
  caste text not null,
  tuition_fee numeric not null,
  development_fee numeric not null,
  exam_fee numeric not null,
  other_fee numeric not null,
  total_fee numeric not null,
  created_at timestamptz not null default now(),
  unique(branch, year, caste)
);

create table if not exists student_fees (
  id bigserial primary key,
  student_id bigint not null references users(id) on delete cascade,
  academic_year integer not null,
  tuition numeric not null,
  development numeric not null,
  exam numeric not null,
  other numeric not null,
  total numeric not null,
  paid_amount numeric not null default 0,
  pending_amount numeric not null default 0,
  status text not null check (status in ('PAID', 'UNPAID')),
  created_at timestamptz not null default now()
);

create table if not exists attendance_sessions (
  id bigserial primary key,
  subject text not null,
  faculty_id bigint not null references users(id) on delete set null,
  expire_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists attendance (
  id bigserial primary key,
  student_id bigint not null references users(id) on delete cascade,
  date date not null,
  status text not null,
  latitude numeric,
  longitude numeric,
  subject text,
  session_id bigint not null references attendance_sessions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists results (
  id bigserial primary key,
  student_id bigint not null references users(id) on delete cascade,
  subject text not null,
  internal integer not null,
  external integer not null,
  total integer not null,
  semester text not null,
  created_at timestamptz not null default now()
);

create table if not exists result_issues (
  id bigserial primary key,
  result_id bigint not null references results(id) on delete cascade,
  student_id bigint not null references users(id) on delete cascade,
  message text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'RESOLVED', 'DECLINED')),
  faculty_message text,
  created_at timestamptz not null default now()
);

create table if not exists resources (
  id bigserial primary key,
  name text not null,
  capacity integer,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists books (
  id bigserial primary key,
  name text not null,
  author text,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists exams (
  id bigserial primary key,
  branch text,
  year integer,
  subject text,
  date date,
  time text,
  created_at timestamptz not null default now()
);

create table if not exists notices (
  id bigserial primary key,
  title text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists academic_events (
  id bigserial primary key,
  event text not null,
  date date not null unique,
  created_at timestamptz not null default now()
);
