import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Table, Badge, statusTone, LinkButton } from "@/components/ui";
import { rupees, fmtDate, today } from "@/lib/format";
import { generateMonthlyTuition, updateFeeItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function Fees({ searchParams }: { searchParams: Promise<{ status?: string; generated?: string }> }) {
  const { status, generated } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("invoice_summary").select("*").order("issued_on", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const [{ data }, { data: items }] = await Promise.all([q, supabase.from("fee_items").select("*").order("name")]);
  const tabs = [["", "All"], ["unpaid", "Unpaid"], ["partial", "Partial"], ["paid", "Paid"], ["void", "Void"]];

  return (
    <>
      <PageHeader title="Fees" subtitle="Invoices, receipts and monthly billing."
        action={<LinkButton href="/fees/new"><Plus className="h-4 w-4" /> New invoice</LinkButton>} />
      {generated !== undefined && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Created {generated} tuition invoice(s).</p>}

      <div className="mb-4 flex gap-1">
        {tabs.map(([v, l]) => (
          <Link key={v} href={v ? `/fees?status=${v}` : "/fees"} className={`rounded-lg px-3 py-1.5 text-sm ${(status ?? "") === v ? "bg-brand-soft font-medium text-brand" : "text-ink-soft hover:bg-white"}`}>{l}</Link>
        ))}
      </div>
      <Table head={["Invoice", "Student", "Title", "Total", "Balance", "Status"]} empty={data?.length ? undefined : "No invoices."}>
        {(data ?? []).map((i) => (
          <tr key={i.id} className="hover:bg-surface-alt/50">
            <td className="td"><Link href={`/fees/${i.id}`} className="font-medium text-brand">#{i.invoice_no}</Link></td>
            <td className="td">{i.student_name} <span className="text-xs text-ink-mute">{i.admission_no}</span></td>
            <td className="td text-ink-soft">{i.title}<div className="text-xs text-ink-mute">{fmtDate(i.issued_on)}</div></td>
            <td className="td">{rupees(i.total_paise)}</td>
            <td className="td">{rupees(i.total_paise - i.paid_paise)}</td>
            <td className="td"><Badge tone={statusTone(i.status) as never}>{i.status}</Badge></td>
          </tr>
        ))}
      </Table>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">Bill monthly tuition</h2>
          <p className="mt-1 text-sm text-ink-soft">Creates a Tuition invoice for every active student not yet billed for that month.</p>
          <form action={generateMonthlyTuition} className="mt-4 flex gap-2">
            <input type="month" name="month" defaultValue={today().slice(0, 7)} className="input" />
            <button className="btn-primary whitespace-nowrap">Generate</button>
          </form>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Fee structure</h2>
          <p className="mt-1 text-sm text-ink-soft">Defaults applied to new admissions. Admin only.</p>
          <div className="mt-4 space-y-2">
            {(items ?? []).map((f) => (
              <form key={f.id} action={updateFeeItem} className="flex items-center gap-2">
                <input type="hidden" name="id" value={f.id} />
                <span className="w-28 text-sm">{f.name}</span>
                <input name="amount" defaultValue={f.amount_paise / 100} className="input" inputMode="decimal" />
                <button className="btn-ghost px-3">Save</button>
              </form>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
