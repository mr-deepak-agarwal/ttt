-- Taught To Teach School of Music, Art and Dance — ERP schema
-- Money is stored as integer paise (₹1 = 100 paise). Dates are real DATE/TIMESTAMPTZ.

create extension if not exists "pgcrypto";

-- ───────── Enums ─────────
create type user_role as enum ('admin', 'staff', 'teacher');
create type course_type as enum ('regular', 'crash_course');
create type class_mode as enum ('individual', 'group');
create type enquiry_status as enum ('open', 'admitted', 'closed');
create type student_status as enum ('active', 'inactive', 'alumni');
create type invoice_status as enum ('unpaid', 'partial', 'paid', 'void');
create type pay_method as enum ('cash', 'upi', 'card', 'bank', 'cheque');
create type attendance_status as enum ('present', 'absent', 'late', 'excused');

-- ───────── Branches & users ─────────
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role user_role not null default 'staff',
  branch_id uuid references branches(id),
  created_at timestamptz not null default now()
);

-- ───────── People ─────────
create table teachers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id),
  full_name text not null,
  phone text,
  email text,
  instruments text[] not null default '{}',
  monthly_salary_paise bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_no bigint generated always as identity,
  branch_id uuid references branches(id),
  full_name text not null,
  age int,
  address text,
  qualification text,
  work_or_study text,
  guardian_name text,
  guardian_relation text,
  phone text,
  whatsapp text,
  email text,
  instrument text,
  prior_knowledge text,
  course_type course_type not null default 'regular',
  class_mode class_mode not null default 'individual',
  status enquiry_status not null default 'open',
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  admission_no text unique,                     -- e.g. 26001, set by trigger
  branch_id uuid references branches(id),
  enquiry_id uuid references enquiries(id),
  full_name text not null,
  dob date,
  address text,
  qualification text,
  work_or_study text,
  guardian_name text,
  guardian_relation text,
  phone text,
  whatsapp text,
  email text,
  instrument text,
  prior_knowledge text,
  course_type course_type not null default 'regular',
  class_mode class_mode not null default 'individual',
  lessons_per_week int not null default 1,
  indoor_outdoor text,
  photo_path text,
  status student_status not null default 'active',
  remarks text,
  admitted_on date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Admission number = YY + 3-digit running count for that year, race-safe via counter table.
create table admission_counters (
  year int primary key,
  last_value int not null default 0
);

create or replace function assign_admission_no() returns trigger as $$
declare
  yr int := extract(year from coalesce(new.admitted_on, current_date));
  n int;
begin
  if new.admission_no is not null then return new; end if;
  insert into admission_counters(year, last_value) values (yr, 1)
    on conflict (year) do update set last_value = admission_counters.last_value + 1
    returning last_value into n;
  new.admission_no := right(yr::text, 2) || lpad(n::text, 3, '0');
  return new;
end $$ language plpgsql;

create trigger trg_students_admission_no before insert on students
  for each row execute function assign_admission_no();

-- ───────── Academics ─────────
create table courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,                  -- Piano, Guitar, Kathak ...
  category text not null default 'Music',
  active boolean not null default true
);

create table batches (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id),
  course_id uuid not null references courses(id),
  teacher_id uuid references teachers(id),
  name text not null,
  class_mode class_mode not null default 'group',
  weekdays int[] not null default '{}',   -- 0=Sun … 6=Sat
  start_time time,
  end_time time,
  room text,
  capacity int,
  active boolean not null default true
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  joined_on date not null default current_date,
  left_on date,
  unique (student_id, batch_id)
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  batch_id uuid references batches(id) on delete set null,
  teacher_id uuid references teachers(id) on delete set null,
  attended_on date not null default current_date,
  status attendance_status not null default 'present',
  class_mode class_mode not null default 'individual',
  marked_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (student_id, batch_id, attended_on)
);

create table teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  attended_on date not null default current_date,
  status attendance_status not null default 'present',
  unique (teacher_id, attended_on)
);

-- ───────── Fees ─────────
create table fee_items (            -- the old "feesmaster"
  id uuid primary key default gen_random_uuid(),
  name text not null unique,        -- Admission, Tuition, Books, Outdoor
  amount_paise bigint not null default 0,
  recurring boolean not null default false,   -- Tuition recurs monthly
  active boolean not null default true
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no bigint generated always as identity,
  student_id uuid not null references students(id) on delete cascade,
  title text not null,                 -- "Admission 2026", "Tuition Nov 2026"
  issued_on date not null default current_date,
  due_on date,
  status invoice_status not null default 'unpaid',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  amount_paise bigint not null check (amount_paise >= 0)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  receipt_no bigint generated always as identity,
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  method pay_method not null default 'cash',
  reference text,
  paid_on date not null default current_date,
  received_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create view invoice_summary as
select
  i.id, i.invoice_no, i.student_id, st.full_name as student_name, st.admission_no,
  i.title, i.issued_on, i.due_on, i.status,
  coalesce((select sum(amount_paise) from invoice_items x where x.invoice_id = i.id), 0) as total_paise,
  coalesce((select sum(amount_paise) from payments p where p.invoice_id = i.id), 0) as paid_paise
from invoices i join students st on st.id = i.student_id;

create or replace function refresh_invoice_status() returns trigger as $$
declare
  inv uuid := coalesce(new.invoice_id, old.invoice_id);
  tot bigint; paid bigint;
begin
  select coalesce(sum(amount_paise),0) into tot from invoice_items where invoice_id = inv;
  select coalesce(sum(amount_paise),0) into paid from payments where invoice_id = inv;
  update invoices set status = case
      when status = 'void' then 'void'::invoice_status
      when paid <= 0 then 'unpaid'::invoice_status
      when paid >= tot then 'paid'::invoice_status
      else 'partial'::invoice_status end
    where id = inv;
  return null;
end $$ language plpgsql;

create trigger trg_pay_status after insert or update or delete on payments
  for each row execute function refresh_invoice_status();
create trigger trg_item_status after insert or update or delete on invoice_items
  for each row execute function refresh_invoice_status();

-- ───────── Payroll ─────────
create table payroll (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  period text not null,                 -- '2026-11'
  amount_paise bigint not null check (amount_paise >= 0),
  description text,
  paid_on date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ───────── Certificates / exams ─────────
create table certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete set null,
  instrument text not null,
  grade text not null,
  session text,                          -- exam session e.g. 'Nov 2026'
  file_path text,                        -- Supabase Storage path
  issued_on date not null default current_date,
  created_by uuid references auth.users(id)
);

-- ───────── Library ─────────
create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  copies int not null default 1,
  created_at timestamptz not null default now()
);

create table book_loans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  issued_on date not null default current_date,
  returned_on date,
  issued_by uuid references auth.users(id)
);

-- ───────── Indexes ─────────
create index on students (status);
create index on enquiries (status);
create index on attendance (attended_on);
create index on attendance (student_id);
create index on invoices (student_id);
create index on payments (invoice_id);
create index on enrollments (batch_id);
create index on book_loans (student_id) where returned_on is null;
