import { createClient } from "@/lib/supabase/server";
import { PageHeader, Field } from "@/components/ui";
import { createBatch } from "../actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function NewBatch() {
  const supabase = await createClient();
  const [courses, teachers] = await Promise.all([
    supabase.from("courses").select("id, name").eq("active", true).order("name"),
    supabase.from("teachers").select("id, full_name").eq("active", true).order("full_name"),
  ]);
  return (
    <>
      <PageHeader title="New batch" />
      <form action={createBatch} className="card grid max-w-3xl gap-4 p-6 sm:grid-cols-2">
        <Field label="Batch name *" className="sm:col-span-2"><input name="name" required className="input" placeholder="Piano — Mon/Wed evening" /></Field>
        <Field label="Course *"><select name="course_id" required className="input">{courses.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Teacher"><select name="teacher_id" className="input"><option value="">— unassigned —</option>{teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></Field>
        <Field label="Class mode"><select name="class_mode" className="input"><option value="group">Group</option><option value="individual">Individual</option></select></Field>
        <Field label="Room"><input name="room" className="input" /></Field>
        <Field label="Start time"><input name="start_time" type="time" className="input" /></Field>
        <Field label="End time"><input name="end_time" type="time" className="input" /></Field>
        <Field label="Capacity"><input name="capacity" type="number" min={1} className="input" /></Field>
        <Field label="Days" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d, i) => (
              <label key={d} className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-line px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                <input type="checkbox" name="weekdays" value={i} className="accent-brand" /> {d}
              </label>
            ))}
          </div>
        </Field>
        <div className="sm:col-span-2"><button className="btn-primary">Create batch</button></div>
      </form>
    </>
  );
}
