import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Table, Badge, statusTone, LinkButton } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Students({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("students").select("id, admission_no, full_name, instrument, phone, class_mode, status, admitted_on")
    .order("admitted_on", { ascending: false }).limit(200);
  if (q) {
    const s = q.replace(/[%,()]/g, " ").trim();
    query = query.or(`full_name.ilike.%${s}%,admission_no.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  const { data } = await query;

  return (
    <>
      <PageHeader title="Students" subtitle={`${data?.length ?? 0} shown`}
        action={<LinkButton href="/students/new"><Plus className="h-4 w-4" /> Direct admission</LinkButton>} />
      <form className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-mute" />
        <input name="q" defaultValue={q} placeholder="Search name, number or phone" className="input pl-9" />
      </form>
      <Table head={["No.", "Name", "Instrument", "Mode", "Phone", "Admitted", "Status"]} empty={data?.length ? undefined : "No students found."}>
        {(data ?? []).map((s) => (
          <tr key={s.id} className="hover:bg-surface-alt/50">
            <td className="td text-ink-mute">{s.admission_no}</td>
            <td className="td font-medium"><Link href={`/students/${s.id}`} className="hover:text-brand">{s.full_name}</Link></td>
            <td className="td text-ink-soft">{s.instrument ?? "—"}</td>
            <td className="td capitalize text-ink-soft">{s.class_mode}</td>
            <td className="td text-ink-soft">{s.phone ?? "—"}</td>
            <td className="td text-ink-soft">{fmtDate(s.admitted_on)}</td>
            <td className="td"><Badge tone={statusTone(s.status) as never}>{s.status}</Badge></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
