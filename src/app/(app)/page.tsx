import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Stat, Table, Badge, statusTone } from "@/components/ui";
import { rupees, fmtDate, today } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const monthStart = today().slice(0, 8) + "01";

  const [students, openEnq, todayAtt, invoices, monthPay, recentEnq, dueInv] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("attendance").select("id", { count: "exact", head: true }).eq("attended_on", today()).eq("status", "present"),
    supabase.from("invoice_summary").select("total_paise, paid_paise, status").neq("status", "void"),
    supabase.from("payments").select("amount_paise").gte("paid_on", monthStart),
    supabase.from("enquiries").select("id, full_name, instrument, created_at, status").order("created_at", { ascending: false }).limit(5),
    supabase.from("invoice_summary").select("id, invoice_no, title, status, total_paise, paid_paise, student_id, student_name")
      .in("status", ["unpaid", "partial"]).order("issued_on").limit(5),
  ]);

  const outstanding = (invoices.data ?? []).reduce((s, i) => s + (i.total_paise - i.paid_paise), 0);
  const collected = (monthPay.data ?? []).reduce((s, p) => s + p.amount_paise, 0);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active students" value={students.count ?? 0} />
        <Stat label="Open enquiries" value={openEnq.count ?? 0} tone="amber" />
        <Stat label="Present today" value={todayAtt.count ?? 0} tone="green" />
        <Stat label="Collected this month" value={rupees(collected)} hint={`Outstanding ${rupees(outstanding)}`} tone={outstanding > 0 ? "red" : "green"} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Recent enquiries</h2><Link href="/enquiries" className="text-sm text-brand">View all</Link></div>
          <Table head={["Name", "Instrument", "Date", "Status"]} empty={recentEnq.data?.length ? undefined : "No enquiries yet."}>
            {(recentEnq.data ?? []).map((e) => (
              <tr key={e.id}>
                <td className="td font-medium">{e.full_name}</td>
                <td className="td text-ink-soft">{e.instrument ?? "—"}</td>
                <td className="td text-ink-soft">{fmtDate(e.created_at)}</td>
                <td className="td"><Badge tone={statusTone(e.status) as never}>{e.status}</Badge></td>
              </tr>
            ))}
          </Table>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Pending fees</h2><Link href="/fees" className="text-sm text-brand">View all</Link></div>
          <Table head={["Student", "Invoice", "Balance", "Status"]} empty={dueInv.data?.length ? undefined : "Nothing pending 🎉"}>
            {(dueInv.data ?? []).map((i: any) => (
              <tr key={i.id}>
                <td className="td font-medium">{i.student_name}</td>
                <td className="td"><Link href={`/fees/${i.id}`} className="text-brand">#{i.invoice_no}</Link> <span className="text-ink-mute">{i.title}</span></td>
                <td className="td">{rupees(i.total_paise - i.paid_paise)}</td>
                <td className="td"><Badge tone={statusTone(i.status) as never}>{i.status}</Badge></td>
              </tr>
            ))}
          </Table>
        </section>
      </div>
    </>
  );
}
