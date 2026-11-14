import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { today } from "@/lib/format";
import { saveAttendance } from "./actions";

export const dynamic = "force-dynamic";
const STATUSES = ["present", "absent", "late", "excused"] as const;

export default async function Attendance({ searchParams }: { searchParams: Promise<{ batch?: string; date?: string }> }) {
  const { batch, date = today() } = await searchParams;
  const supabase = await createClient();
  const { data: batches } = await supabase.from("batches").select("id, name, teacher_id, class_mode").eq("active", true).order("name");
  const current = batches?.find((b) => b.id === batch);

  let roster: { id: string; full_name: string; admission_no: string | null; status: string }[] = [];
  if (current) {
    const { data: enr } = await supabase.from("enrollments").select("students(id, full_name, admission_no, status)").eq("batch_id", current.id);
    const { data: marked } = await supabase.from("attendance").select("student_id, status").eq("batch_id", current.id).eq("attended_on", date);
    const m = new Map((marked ?? []).map((a) => [a.student_id, a.status]));
    roster = (enr ?? []).map((e: any) => e.students).filter((s: any) => s && s.status === "active")
      .map((s: any) => ({ id: s.id, full_name: s.full_name, admission_no: s.admission_no, status: m.get(s.id) ?? "present" }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }

  return (
    <>
      <PageHeader title="Attendance" subtitle="Pick a batch and a date, then mark the class." />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div><label className="label">Batch</label>
          <select name="batch" defaultValue={batch} className="input min-w-56"><option value="">Select…</option>{batches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
        <div><label className="label">Date</label><input type="date" name="date" defaultValue={date} className="input" /></div>
        <button className="btn-ghost">Load</button>
      </form>

      {current && (
        <form action={saveAttendance} className="card max-w-2xl">
          <input type="hidden" name="batch_id" value={current.id} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="teacher_id" value={current.teacher_id ?? ""} />
          <input type="hidden" name="class_mode" value={current.class_mode} />
          {roster.length === 0 && <p className="p-6 text-sm text-ink-mute">No active students in this batch. Add them from a student&apos;s page.</p>}
          <ul className="divide-y divide-surface-line">
            {roster.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <input type="hidden" name="student_id" value={s.id} />
                <div><div className="text-sm font-medium">{s.full_name}</div><div className="text-xs text-ink-mute">{s.admission_no}</div></div>
                <div className="flex gap-1">
                  {STATUSES.map((st) => (
                    <label key={st} className="cursor-pointer rounded-lg border border-surface-line px-3 py-1 text-xs capitalize text-ink-soft has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand">
                      <input type="radio" name={`status_${s.id}`} value={st} defaultChecked={s.status === st} className="sr-only" /> {st}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {roster.length > 0 && <div className="border-t border-surface-line p-4"><button className="btn-primary">Save attendance</button></div>}
        </form>
      )}
    </>
  );
}
