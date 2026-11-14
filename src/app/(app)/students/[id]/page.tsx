import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge, statusTone, Table, Stat } from "@/components/ui";
import { fmtDate, rupees } from "@/lib/format";
import { enrollStudent, setStudentStatus, uploadPhoto } from "../actions";

export const dynamic = "force-dynamic";

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: s } = await supabase.from("students").select("*").eq("id", id).single();
  if (!s) notFound();

  const [inv, enr, batches, att, certs] = await Promise.all([
    supabase.from("invoice_summary").select("*").eq("student_id", id).order("issued_on", { ascending: false }),
    supabase.from("enrollments").select("id, batches(name, courses(name))").eq("student_id", id),
    supabase.from("batches").select("id, name").eq("active", true).order("name"),
    supabase.from("attendance").select("status").eq("student_id", id),
    supabase.from("certificates").select("id, instrument, grade, session, issued_on").eq("student_id", id),
  ]);

  let photoUrl: string | null = null;
  if (s.photo_path) {
    const { data } = await supabase.storage.from("student-photos").createSignedUrl(s.photo_path, 3600);
    photoUrl = data?.signedUrl ?? null;
  }

  const total = (inv.data ?? []).reduce((a, i) => a + i.total_paise, 0);
  const paid = (inv.data ?? []).reduce((a, i) => a + i.paid_paise, 0);
  const attended = (att.data ?? []).filter((a) => a.status === "present" || a.status === "late").length;
  const attTotal = att.data?.length ?? 0;

  const rows: [string, string | null][] = [
    ["Guardian", [s.guardian_name, s.guardian_relation && `(${s.guardian_relation})`].filter(Boolean).join(" ") || null],
    ["Phone", s.phone], ["WhatsApp", s.whatsapp], ["Email", s.email], ["Date of birth", s.dob ? fmtDate(s.dob) : null],
    ["Qualification", s.qualification], ["Address", s.address], ["Prior knowledge", s.prior_knowledge],
    ["Lessons / week", String(s.lessons_per_week)], ["Course", `${s.course_type.replace("_", " ")} · ${s.class_mode}`],
  ];

  return (
    <>
      <PageHeader title={s.full_name} subtitle={`Student no. ${s.admission_no} · admitted ${fmtDate(s.admitted_on)}${s.instrument ? ` · ${s.instrument}` : ""}`}
        action={<Badge tone={statusTone(s.status) as never}>{s.status}</Badge>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Billed" value={rupees(total)} />
        <Stat label="Paid" value={rupees(paid)} tone="green" />
        <Stat label="Attendance" value={attTotal ? `${Math.round((attended / attTotal) * 100)}%` : "—"} hint={`${attended} of ${attTotal} classes`} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card divide-y divide-surface-line">
            {rows.map(([k, v]) => (
              <div key={k} className="flex gap-4 px-5 py-3 text-sm"><div className="w-36 shrink-0 text-ink-soft">{k}</div><div>{v || "—"}</div></div>
            ))}
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Invoices</h2>
            <Table head={["#", "Title", "Total", "Paid", "Status"]} empty={inv.data?.length ? undefined : "No invoices."}>
              {(inv.data ?? []).map((i) => (
                <tr key={i.id}>
                  <td className="td"><Link href={`/fees/${i.id}`} className="text-brand">#{i.invoice_no}</Link></td>
                  <td className="td">{i.title}</td><td className="td">{rupees(i.total_paise)}</td><td className="td">{rupees(i.paid_paise)}</td>
                  <td className="td"><Badge tone={statusTone(i.status) as never}>{i.status}</Badge></td>
                </tr>
              ))}
            </Table>
          </section>

          {!!certs.data?.length && (
            <section>
              <h2 className="mb-3 font-semibold">Certificates</h2>
              <Table head={["Instrument", "Grade", "Session", "Issued"]}>
                {certs.data.map((c) => (
                  <tr key={c.id}><td className="td">{c.instrument}</td><td className="td">{c.grade}</td><td className="td">{c.session ?? "—"}</td><td className="td">{fmtDate(c.issued_on)}</td></tr>
                ))}
              </Table>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            {photoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photoUrl} alt={s.full_name} className="mb-4 aspect-square w-full rounded-xl object-cover" />
              : <div className="mb-4 grid aspect-square w-full place-items-center rounded-xl bg-surface-alt text-4xl text-ink-mute">{s.full_name[0]}</div>}
            <form action={uploadPhoto} className="space-y-2">
              <input type="hidden" name="id" value={s.id} />
              <input type="file" name="photo" accept="image/*" className="text-xs" required />
              <button className="btn-ghost w-full">Upload photo</button>
            </form>
          </section>

          <section className="card p-5">
            <h3 className="mb-3 text-sm font-semibold">Batches</h3>
            <ul className="mb-3 space-y-1 text-sm">
              {(enr.data ?? []).map((e: any) => <li key={e.id}>{e.batches?.name} <span className="text-ink-mute">· {e.batches?.courses?.name}</span></li>)}
              {!enr.data?.length && <li className="text-ink-mute">Not in any batch yet.</li>}
            </ul>
            <form action={enrollStudent} className="flex gap-2">
              <input type="hidden" name="student_id" value={s.id} />
              <select name="batch_id" className="input" required><option value="">Add to batch…</option>
                {(batches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              <button className="btn-primary px-3">Add</button>
            </form>
          </section>

          <section className="card p-5">
            <h3 className="mb-3 text-sm font-semibold">Status</h3>
            <form action={setStudentStatus} className="flex gap-2">
              <input type="hidden" name="id" value={s.id} />
              <select name="status" defaultValue={s.status} className="input"><option value="active">Active</option><option value="inactive">Inactive</option><option value="alumni">Alumni</option></select>
              <button className="btn-ghost">Save</button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
