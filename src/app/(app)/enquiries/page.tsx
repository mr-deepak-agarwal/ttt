import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Table, Badge, statusTone, LinkButton } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("enquiries").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const tabs = [["", "All"], ["open", "Open"], ["admitted", "Admitted"], ["closed", "Closed"]];

  return (
    <>
      <PageHeader title="Enquiries" subtitle="Track every walk-in and call until they join."
        action={<LinkButton href="/enquiries/new"><Plus className="h-4 w-4" /> New enquiry</LinkButton>} />
      <div className="mb-4 flex gap-1">
        {tabs.map(([v, l]) => (
          <Link key={v} href={v ? `/enquiries?status=${v}` : "/enquiries"}
            className={`rounded-lg px-3 py-1.5 text-sm ${(status ?? "") === v ? "bg-brand-soft font-medium text-brand" : "text-ink-soft hover:bg-white"}`}>{l}</Link>
        ))}
      </div>
      <Table head={["#", "Name", "Instrument", "Phone", "Date", "Status"]} empty={data?.length ? undefined : "No enquiries here."}>
        {(data ?? []).map((e) => (
          <tr key={e.id} className="hover:bg-surface-alt/50">
            <td className="td text-ink-mute">{e.enquiry_no}</td>
            <td className="td font-medium"><Link href={`/enquiries/${e.id}`} className="hover:text-brand">{e.full_name}</Link></td>
            <td className="td text-ink-soft">{e.instrument ?? "—"}</td>
            <td className="td text-ink-soft">{e.phone ?? "—"}</td>
            <td className="td text-ink-soft">{fmtDate(e.created_at)}</td>
            <td className="td"><Badge tone={statusTone(e.status) as never}>{e.status}</Badge></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
