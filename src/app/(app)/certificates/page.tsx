import { createClient } from "@/lib/supabase/server";
import { PageHeader, Table, Field } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { addCertificate } from "./actions";

export const dynamic = "force-dynamic";

export default async function Certificates() {
  const supabase = await createClient();
  const [{ data: certs }, { data: students }, { data: teachers }] = await Promise.all([
    supabase.from("certificates").select("id, instrument, grade, session, issued_on, file_path, students(full_name, admission_no), teachers(full_name)").order("issued_on", { ascending: false }).limit(100),
    supabase.from("students").select("id, full_name, admission_no").order("full_name"),
    supabase.from("teachers").select("id, full_name").eq("active", true).order("full_name"),
  ]);
  const signed = new Map<string, string>();
  for (const c of certs ?? []) {
    if (c.file_path) {
      const { data } = await supabase.storage.from("certificates").createSignedUrl(c.file_path, 3600);
      if (data) signed.set(c.id, data.signedUrl);
    }
  }
  return (
    <>
      <PageHeader title="Certificates" subtitle="Exam grades and issued certificates." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Table head={["Student", "Instrument", "Grade", "Session", "Issued", "File"]} empty={certs?.length ? undefined : "No certificates yet."}>
          {(certs ?? []).map((c: any) => (
            <tr key={c.id}>
              <td className="td font-medium">{c.students?.full_name} <span className="text-xs text-ink-mute">{c.students?.admission_no}</span></td>
              <td className="td">{c.instrument}</td><td className="td">{c.grade}</td><td className="td text-ink-soft">{c.session ?? "—"}</td>
              <td className="td text-ink-soft">{fmtDate(c.issued_on)}</td>
              <td className="td">{signed.get(c.id) ? <a href={signed.get(c.id)} target="_blank" className="text-brand">Open</a> : "—"}</td>
            </tr>
          ))}
        </Table>
        <form action={addCertificate} className="card h-fit space-y-3 p-5">
          <h3 className="font-semibold">Add certificate</h3>
          <Field label="Student *"><select name="student_id" required className="input"><option value="">Select…</option>{students?.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>)}</select></Field>
          <Field label="Teacher"><select name="teacher_id" className="input"><option value="">—</option>{teachers?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></Field>
          <Field label="Instrument *"><input name="instrument" required className="input" /></Field>
          <Field label="Grade *"><input name="grade" required className="input" placeholder="Grade 3" /></Field>
          <Field label="Session"><input name="session" className="input" placeholder="Nov 2026" /></Field>
          <Field label="File (PDF / image)"><input name="file" type="file" accept=".pdf,image/*" className="text-xs" /></Field>
          <button className="btn-primary w-full">Save</button>
        </form>
      </div>
    </>
  );
}
