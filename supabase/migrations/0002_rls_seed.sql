-- Row level security, profile bootstrap and seed data

-- ───────── Helpers ─────────
create or replace function public.current_role_name() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_name() in ('admin','staff'), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_name() = 'admin', false)
$$;

-- First user to sign up becomes admin; everyone after that is plain staff.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role, branch_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when (select count(*) from profiles) = 0 then 'admin'::user_role else 'staff'::user_role end,
    (select id from branches order by created_at limit 1)
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── Enable RLS ─────────
alter table branches            enable row level security;
alter table profiles            enable row level security;
alter table teachers            enable row level security;
alter table enquiries           enable row level security;
alter table students            enable row level security;
alter table admission_counters  enable row level security;
alter table courses             enable row level security;
alter table batches             enable row level security;
alter table enrollments         enable row level security;
alter table attendance          enable row level security;
alter table teacher_attendance  enable row level security;
alter table fee_items           enable row level security;
alter table invoices            enable row level security;
alter table invoice_items       enable row level security;
alter table payments            enable row level security;
alter table payroll             enable row level security;
alter table certificates        enable row level security;
alter table books               enable row level security;
alter table book_loans          enable row level security;

-- ───────── Policies ─────────
-- Profiles: you can read your own; admins read/write all.
create policy "profiles self read"  on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles admin write" on profiles for all using (is_admin()) with check (is_admin());

-- Reference data: any signed-in user reads, admin writes.
create policy "branches read"  on branches  for select using (auth.uid() is not null);
create policy "branches write" on branches  for all using (is_admin()) with check (is_admin());
create policy "courses read"   on courses   for select using (auth.uid() is not null);
create policy "courses write"  on courses   for all using (is_admin()) with check (is_admin());
create policy "fee_items read"  on fee_items for select using (auth.uid() is not null);
create policy "fee_items write" on fee_items for all using (is_admin()) with check (is_admin());
create policy "teachers read"  on teachers  for select using (auth.uid() is not null);
create policy "teachers write" on teachers  for all using (is_admin()) with check (is_admin());
create policy "batches read"   on batches   for select using (auth.uid() is not null);
create policy "batches write"  on batches   for all using (is_staff()) with check (is_staff());

-- Front-desk data: staff and admin full access; teachers can read students/enrollments.
create policy "enquiries staff" on enquiries for all using (is_staff()) with check (is_staff());
create policy "students staff"  on students  for all using (is_staff()) with check (is_staff());
create policy "students teacher read" on students for select using (current_role_name() = 'teacher');
create policy "enrollments staff" on enrollments for all using (is_staff()) with check (is_staff());
create policy "enrollments teacher read" on enrollments for select using (current_role_name() = 'teacher');
create policy "counters staff" on admission_counters for all using (is_staff()) with check (is_staff());

-- Attendance: everyone signed in may mark and read student attendance.
create policy "attendance all" on attendance for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "teacher_attendance staff" on teacher_attendance for all
  using (is_staff()) with check (is_staff());

-- Money: staff handle fees, only admin sees payroll.
create policy "invoices staff"      on invoices      for all using (is_staff()) with check (is_staff());
create policy "invoice_items staff" on invoice_items for all using (is_staff()) with check (is_staff());
create policy "payments staff"      on payments      for all using (is_staff()) with check (is_staff());
create policy "payroll admin"       on payroll       for all using (is_admin()) with check (is_admin());

create policy "certificates staff" on certificates for all using (is_staff()) with check (is_staff());
create policy "books staff"        on books        for all using (is_staff()) with check (is_staff());
create policy "book_loans staff"   on book_loans   for all using (is_staff()) with check (is_staff());

-- invoice_summary is a view; make it respect the caller's RLS.
alter view invoice_summary set (security_invoker = true);

-- ───────── Storage buckets (photos & certificates), private ─────────
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', false), ('certificates', 'certificates', false)
on conflict (id) do nothing;

create policy "staff read files" on storage.objects for select
  using (bucket_id in ('student-photos','certificates') and is_staff());
create policy "staff write files" on storage.objects for insert
  with check (bucket_id in ('student-photos','certificates') and is_staff());
create policy "staff delete files" on storage.objects for delete
  using (bucket_id in ('student-photos','certificates') and is_staff());

-- ───────── Seed ─────────
insert into branches (name) values ('Margao');

insert into fee_items (name, amount_paise, recurring) values
  ('Admission', 600000, false),
  ('Tuition',    50000, true),
  ('Books',      10000, false),
  ('Outdoor',    20000, false);

insert into courses (name, category) values
  ('Piano', 'Music'), ('Keyboard', 'Music'), ('Guitar', 'Music'),
  ('Drums', 'Music'), ('Vocals', 'Music'), ('Violin', 'Music'),
  ('Art', 'Art'), ('Dance', 'Dance');
